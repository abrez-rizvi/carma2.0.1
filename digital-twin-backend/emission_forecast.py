"""
Emission Forecasting API Routes
Random Forest model for CO2 emission forecasting
"""
from flask import jsonify, request
import pandas as pd
import numpy as np
# from sklearn.ensemble import RandomForestRegressor (Removed)
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from datetime import datetime
import os

# Global model instance
_forecaster = None

class EmissionForecaster:
    def __init__(self, data_path='new_daily_emissions_column_format.xlsx'):
        self.data_path = data_path
        self.model = None
        self.df_features = None
        self.feature_cols = None
        self.avg_sectors = None
        self.metrics = {}
        self.n_lags = 14
        self.target_col = 'Total Emissions'
        self.sector_cols = ['Aviation (%)', 'Ground Transport (%)', 'Industry (%)', 'Power (%)', 'Residential (%)']
        
        if os.path.exists(data_path):
            self._train_model()
    
    def _create_features(self, data):
        df_feat = data.copy()
        df_feat = df_feat.dropna(subset=['Date', self.target_col]).reset_index(drop=True)
        
        df_feat['day_of_week'] = df_feat['Date'].dt.dayofweek
        df_feat['day_of_month'] = df_feat['Date'].dt.day
        df_feat['month'] = df_feat['Date'].dt.month
        df_feat['week_of_year'] = df_feat['Date'].dt.isocalendar().week.fillna(1).astype(int)
        df_feat['is_weekend'] = (df_feat['day_of_week'] >= 5).astype(int)
        df_feat['quarter'] = df_feat['Date'].dt.quarter
        df_feat['day_sin'] = np.sin(2 * np.pi * df_feat['day_of_week'] / 7)
        df_feat['day_cos'] = np.cos(2 * np.pi * df_feat['day_of_week'] / 7)
        df_feat['month_sin'] = np.sin(2 * np.pi * df_feat['month'] / 12)
        df_feat['month_cos'] = np.cos(2 * np.pi * df_feat['month'] / 12)
        
        for lag in range(1, self.n_lags + 1):
            df_feat[f'lag_{lag}'] = df_feat[self.target_col].shift(lag)
        df_feat['lag_7_same_day'] = df_feat[self.target_col].shift(7)
        df_feat['lag_14_same_day'] = df_feat[self.target_col].shift(14)
        
        for window in [3, 7, 14]:
            df_feat[f'rolling_mean_{window}'] = df_feat[self.target_col].shift(1).rolling(window=window).mean()
            df_feat[f'rolling_std_{window}'] = df_feat[self.target_col].shift(1).rolling(window=window).std()
        
        df_feat['ema_7'] = df_feat[self.target_col].shift(1).ewm(span=7).mean()
        df_feat['diff_1'] = df_feat[self.target_col].diff(1)
        df_feat = df_feat.dropna().reset_index(drop=True)
        return df_feat
    
    def _train_model(self):
        df = pd.read_excel(self.data_path)
        df['Date'] = pd.to_datetime(df['Date'], dayfirst=True)
        df = df.sort_values('Date').reset_index(drop=True)
        df['Year'] = df['Date'].dt.year
        
        self.avg_sectors = df[self.sector_cols].mean().to_dict()
        self.df = df
        self.df_features = self._create_features(df)
        
        exclude_cols = ['Date', self.target_col, 'Year'] + self.sector_cols
        self.feature_cols = [col for col in self.df_features.columns if col not in exclude_cols]
        
        X = self.df_features[self.feature_cols].values
        y = self.df_features[self.target_col].values
        
        test_size = int(len(X) * 0.15)
        X_train, X_test = X[:-test_size], X[-test_size:]
        y_train, y_test = y[:-test_size], y[-test_size:]
        
        # Using XGBoost for better performance
        from xgboost import XGBRegressor
        
        self.model = XGBRegressor(
            n_estimators=1000,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            early_stopping_rounds=50
        )
        
        # Train with early stopping
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        y_pred = self.model.predict(X_test)
        y_pred = self.model.predict(X_test)
        self.metrics = {
            'r2': round(float(r2_score(y_test, y_pred)), 4),
            'mae': round(float(mean_absolute_error(y_test, y_pred)), 4),
            'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4)
        }
    
    def _forecast_daily(self, n_days):
        last_date = self.df_features['Date'].iloc[-1]
        recent = self.df_features[self.target_col].values[-max(self.n_lags, 14):].tolist()
        forecasts = []
        
        for step in range(1, n_days + 1):
            fd = pd.Timestamp(last_date) + pd.Timedelta(days=step)
            f = {
                'day_of_week': fd.dayofweek, 'day_of_month': fd.day, 'month': fd.month,
                'week_of_year': fd.isocalendar()[1], 'is_weekend': 1 if fd.dayofweek >= 5 else 0,
                'quarter': fd.quarter,
                'day_sin': np.sin(2 * np.pi * fd.dayofweek / 7),
                'day_cos': np.cos(2 * np.pi * fd.dayofweek / 7),
                'month_sin': np.sin(2 * np.pi * fd.month / 12),
                'month_cos': np.cos(2 * np.pi * fd.month / 12),
            }
            for lag in range(1, self.n_lags + 1):
                f[f'lag_{lag}'] = recent[-lag] if lag <= len(recent) else np.mean(recent)
            f['lag_7_same_day'] = recent[-7] if len(recent) >= 7 else np.mean(recent)
            f['lag_14_same_day'] = recent[-14] if len(recent) >= 14 else np.mean(recent)
            for w in [3, 7, 14]:
                wd = recent[-w:] if len(recent) >= w else recent
                f[f'rolling_mean_{w}'] = np.mean(wd)
                f[f'rolling_std_{w}'] = np.std(wd) if len(wd) > 1 else 0
            f['ema_7'] = pd.Series(recent).ewm(span=7).mean().iloc[-1]
            f['diff_1'] = recent[-1] - recent[-2] if len(recent) >= 2 else 0
            
            X_pred = np.array([f[col] for col in self.feature_cols]).reshape(1, -1)
            pred = float(self.model.predict(X_pred)[0])
            
            sector_breakdown = {
                k.replace(' (%)', '').replace(' ', '_'): round(pred * v / 100, 4)
                for k, v in self.avg_sectors.items()
            }
            
            forecasts.append({
                'date': fd.strftime('%Y-%m-%d'),
                'emission': round(pred, 4),
                'sectors': sector_breakdown
            })
            recent.append(pred)
        
        return forecasts
    
    def forecast_days(self, n_days):
        n_days = max(1, min(365, n_days))
        
        # Calculate gap from last data point to today
        last_date = self.df_features['Date'].iloc[-1]
        today = pd.Timestamp(datetime.now().date())
        days_gap = (today - last_date).days
        
        # If there is a gap, extend forecast to cover it + requested days
        total_days = n_days
        if days_gap > 0:
            total_days += days_gap
            
        forecasts = self._forecast_daily(total_days)
        
        # Determine history length: match n_days (requested forecast length)
        # Note: 'n_days' here is the requested length, 'total_days' includes gap fill.
        # User wants "previous 30 days if we choose 30", so we use original n_days.
        history_days = n_days
        
        # Get historical data
        history_data = []
        if self.df is not None and not self.df.empty:
            hist_df = self.df.tail(history_days)
            for _, row in hist_df.iterrows():
                # Calculate sector values from percentages
                sector_breakdown = {}
                for col in self.sector_cols:
                    sector_name = col.replace(' (%)', '').replace(' ', '_')
                    # If column exists in row, use it, otherwise use average
                    pct = row[col] if col in row else self.avg_sectors.get(col, 0)
                    sector_breakdown[sector_name] = round(row[self.target_col] * pct / 100, 4)

                history_data.append({
                    'date': row['Date'].strftime('%Y-%m-%d'),
                    'emission': round(row[self.target_col], 4),
                    'sectors': sector_breakdown,
                    'is_historical': True
                })

        return {
            'type': 'daily',
            'days': n_days,
            'forecasts': forecasts,
            'history': history_data,
            'metrics': self.metrics,
            'sector_percentages': {k.replace(' (%)', ''): round(v, 2) for k, v in self.avg_sectors.items()}
        }
    
    def forecast_years(self, n_years):
        n_years = max(1, min(3, n_years))
        n_days = 365 * (n_years + 1)
        daily = self._forecast_daily(n_days)
        
        # Historical yearly averages
        historical = self.df.groupby('Year')[self.target_col].mean().reset_index()
        
        # Forecasted yearly averages
        df_forecast = pd.DataFrame(daily)
        df_forecast['year'] = pd.to_datetime(df_forecast['date']).dt.year
        forecast_yearly = df_forecast[df_forecast['year'] >= 2026].groupby('year')['emission'].mean()
        forecast_yearly = forecast_yearly.head(n_years)
        
        years_data = []
        for _, row in historical.iterrows():
            years_data.append({
                'year': int(row['Year']),
                'avg_emission': round(row[self.target_col], 4),
                'type': 'historical'
            })
        
        for year, emission in forecast_yearly.items():
            sector_breakdown = {
                k.replace(' (%)', '').replace(' ', '_'): round(emission * v / 100, 4)
                for k, v in self.avg_sectors.items()
            }
            years_data.append({
                'year': int(year),
                'avg_emission': round(emission, 4),
                'type': 'forecast',
                'sectors': sector_breakdown
            })
        
        return {
            'type': 'yearly',
            'years': n_years,
            'data': years_data,
            'metrics': self.metrics,
            'sector_percentages': {k.replace(' (%)', ''): round(v, 2) for k, v in self.avg_sectors.items()}
        }


def get_forecaster():
    global _forecaster
    if _forecaster is None:
        _forecaster = EmissionForecaster()
    return _forecaster


def register_emission_routes(app):
    """Register emission forecast routes with Flask app."""
    
    @app.route('/api/emission/metrics', methods=['GET'])
    def emission_metrics():
        """Get model performance metrics."""
        try:
            forecaster = get_forecaster()
            return jsonify({
                'status': 'success',
                'metrics': forecaster.metrics,
                'sector_percentages': {k.replace(' (%)', ''): round(v, 2) for k, v in forecaster.avg_sectors.items()},
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/emission/forecast/days', methods=['POST'])
    def emission_forecast_days():
        """Forecast emissions for 1-365 days."""
        try:
            data = request.json or {}
            n_days = data.get('days', 30)
            
            forecaster = get_forecaster()
            result = forecaster.forecast_days(n_days)
            
            return jsonify({
                'status': 'success',
                **result,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/emission/forecast/years', methods=['POST'])
    def emission_forecast_years():
        """Forecast yearly averages for 1-3 years."""
        try:
            data = request.json or {}
            n_years = data.get('years', 1)
            
            forecaster = get_forecaster()
            result = forecaster.forecast_years(n_years)
            
            return jsonify({
                'status': 'success',
                **result,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/emission/history/monthly', methods=['GET'])
    def emission_history_monthly():
        """Get monthly aggregated historic data from daily_emissions_2020-25.csv."""
        try:
            csv_path = os.path.join(os.path.dirname(__file__), 'daily_emissions_2020-25.csv')
            
            if not os.path.exists(csv_path):
                return jsonify({'error': 'Historic data file not found'}), 404
            
            # Load data
            df = pd.read_csv(csv_path)
            df['Date'] = pd.to_datetime(df['Date'], dayfirst=True)
            df = df.sort_values('Date').reset_index(drop=True)
            
            # Create month column for grouping
            df['month'] = df['Date'].dt.to_period('M')
            
            # Aggregate by month
            monthly_data = []
            for month, group in df.groupby('month'):
                sectors = {
                    'Aviation': round(group['Aviation (%)'].mean(), 2),
                    'Ground_Transport': round(group['Ground Transport (%)'].mean(), 2),
                    'Industry': round(group['Industry (%)'].mean(), 2),
                    'Power': round(group['Power (%)'].mean(), 2),
                    'Residential': round(group['Residential (%)'].mean(), 2)
                }
                
                monthly_data.append({
                    'month': str(month),
                    'total_emissions': round(group['Total Emissions'].mean(), 2),
                    'aqi': round(group['AQI'].mean(), 0),
                    'sectors': sectors
                })
            
            return jsonify({
                'status': 'success',
                'data': monthly_data,
                'total_months': len(monthly_data),
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # Policy Simulation Endpoints
    from policies_data import get_all_policies, get_policy_by_id, calculate_combined_impact
    
    @app.route('/api/policies', methods=['GET'])
    def list_policies():
        """Get all available policies for simulation."""
        try:
            policies = get_all_policies()
            # Return simplified list for frontend
            policy_list = [{
                'id': p['id'],
                'name': p['name'],
                'icon': p['icon'],
                'description': p['description'],
                'category': p['category'],
                'sector_impacts': p['sector_impacts'],
                'details': p['details'],
                'economic_data': p.get('economic_data', {})
            } for p in policies]
            
            return jsonify({
                'status': 'success',
                'policies': policy_list,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/policies/simulate', methods=['POST'])
    def simulate_policies():
        """
        Simulate the impact of one or more policies on emission forecasts.
        
        Request body:
        {
            "policy_ids": ["odd-even", "construction-ban"],
            "days": 90
        }
        
        Returns baseline and with-policy forecasts for comparison.
        """
        try:
            data = request.json or {}
            policy_ids = data.get('policy_ids', [])
            n_days = data.get('days', 90)
            
            if not policy_ids:
                return jsonify({'error': 'No policies selected'}), 400
            
            # Get baseline forecast
            forecaster = get_forecaster()
            baseline_result = forecaster.forecast_days(n_days)
            baseline_forecasts = baseline_result['forecasts']
            
            # Calculate combined sector impacts
            combined_impacts = calculate_combined_impact(policy_ids)
            
            # Apply policy impacts to create adjusted forecast
            adjusted_forecasts = []
            for forecast in baseline_forecasts:
                adjusted = forecast.copy()
                adjusted['sectors'] = forecast['sectors'].copy()
                
                # Apply sector-specific reductions
                new_total = 0
                for sector, base_value in forecast['sectors'].items():
                    impact = combined_impacts.get(sector, 0)
                    # Apply the reduction/increase
                    adjusted_value = base_value * (1 + impact)
                    adjusted['sectors'][sector] = round(adjusted_value, 4)
                    new_total += adjusted_value
                
                adjusted['emission'] = round(new_total, 4)
                adjusted_forecasts.append(adjusted)
            
            # Calculate summary statistics
            baseline_avg = sum(f['emission'] for f in baseline_forecasts) / len(baseline_forecasts)
            adjusted_avg = sum(f['emission'] for f in adjusted_forecasts) / len(adjusted_forecasts)
            overall_change_pct = round((adjusted_avg - baseline_avg) / baseline_avg * 100, 2)
            
            # Get applied policy names
            applied_policies = []
            for pid in policy_ids:
                policy = get_policy_by_id(pid)
                if policy:
                    applied_policies.append({
                        'id': policy['id'],
                        'name': policy['name'],
                        'icon': policy['icon']
                    })
            
            return jsonify({
                'status': 'success',
                'baseline': baseline_forecasts,
                'with_policy': adjusted_forecasts,
                'combined_impacts': combined_impacts,
                'summary': {
                    'baseline_avg': round(baseline_avg, 2),
                    'adjusted_avg': round(adjusted_avg, 2),
                    'change_pct': overall_change_pct,
                    'total_reduction': round(baseline_avg - adjusted_avg, 2)
                },
                'applied_policies': applied_policies,
                'days': n_days,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/policies/simulate-year', methods=['POST'])
    def simulate_policies_by_year():
        """
        Simulate policies for a specific year using emission_forecast_3years_full.csv data.
        Uses the reduced-form model: ΔE = D × Σ Bᵢ × (αᵢ/100)
        
        Request body:
        {
            "policy_ids": ["odd-even", "construction-ban"],
            "year": 2026
        }
        
        Returns baseline and with-policy forecasts for the selected year.
        """
        try:
            from policies_data import calculate_delta_e, get_model_metadata
            
            data = request.json or {}
            policy_ids = data.get('policy_ids', [])
            year = data.get('year', 2026)
            
            if year not in [2026, 2027, 2028]:
                return jsonify({'error': 'Year must be 2026, 2027, or 2028'}), 400
            
            if not policy_ids:
                return jsonify({'error': 'No policies selected'}), 400
            
            # Load the 3-year forecast data
            forecast_path = os.path.join(os.path.dirname(__file__), 'emission_forecast_3years_full.csv')
            if not os.path.exists(forecast_path):
                return jsonify({'error': 'Forecast data file not found'}), 404
            
            df = pd.read_csv(forecast_path)
            df['Date'] = pd.to_datetime(df['Date'])
            df['Year'] = df['Date'].dt.year
            
            # Filter for selected year
            year_df = df[df['Year'] == year].copy()
            
            if year_df.empty:
                return jsonify({'error': f'No data available for year {year}'}), 404
            
            # Create baseline forecasts from CSV data
            baseline_forecasts = []
            for _, row in year_df.iterrows():
                baseline_forecasts.append({
                    'date': row['Date'].strftime('%Y-%m-%d'),
                    'emission': round(row['Total_Emission'], 4),
                    'sectors': {
                        'Aviation': round(row['Aviation'], 4),
                        'Ground_Transport': round(row['Ground_Transport'], 4),
                        'Industry': round(row['Industry'], 4),
                        'Power': round(row['Power'], 4),
                        'Residential': round(row['Residential'], 4)
                    }
                })
            
            # Calculate using reduced-form model: ΔE = D × Σ Bᵢ × (αᵢ/100)
            model_result = calculate_delta_e(policy_ids)
            delta_e = model_result['delta_e']
            combined_impacts = calculate_combined_impact(policy_ids)
            
            # Apply policy impacts to create adjusted forecast
            adjusted_forecasts = []
            for forecast in baseline_forecasts:
                adjusted = forecast.copy()
                adjusted['sectors'] = forecast['sectors'].copy()
                
                # Apply sector-specific reductions
                new_total = 0
                for sector, base_value in forecast['sectors'].items():
                    impact = combined_impacts.get(sector, 0)
                    adjusted_value = base_value * (1 + impact)
                    adjusted['sectors'][sector] = round(adjusted_value, 4)
                    new_total += adjusted_value
                
                adjusted['emission'] = round(new_total, 4)
                adjusted_forecasts.append(adjusted)
            
            # Calculate summary statistics
            baseline_avg = sum(f['emission'] for f in baseline_forecasts) / len(baseline_forecasts)
            adjusted_avg = sum(f['emission'] for f in adjusted_forecasts) / len(adjusted_forecasts)
            overall_change_pct = round((adjusted_avg - baseline_avg) / baseline_avg * 100, 2)
            
            # Get applied policy names
            applied_policies = []
            for pid in policy_ids:
                policy = get_policy_by_id(pid)
                if policy:
                    applied_policies.append({
                        'id': policy['id'],
                        'name': policy['name'],
                        'icon': policy['icon'],
                        'description': policy.get('description', ''),
                        'category': policy.get('category', 'General'),
                        'details': policy.get('details', {})
                    })
            
            # Calculate yearly totals
            baseline_yearly_total = sum(f['emission'] for f in baseline_forecasts)
            adjusted_yearly_total = sum(f['emission'] for f in adjusted_forecasts)
            
            # Get model metadata for interpretation
            model_metadata = get_model_metadata()
            
            return jsonify({
                'status': 'success',
                'year': year,
                'baseline': baseline_forecasts,
                'with_policy': adjusted_forecasts,
                'combined_impacts': combined_impacts,
                'model_calculation': {
                    **model_result,
                    'model_name': model_metadata['model_name'],
                    'interpretation': model_metadata['interpretation']
                },
                'summary': {
                    'baseline_avg': round(baseline_avg, 2),
                    'adjusted_avg': round(adjusted_avg, 2),
                    'change_pct': overall_change_pct,
                    'delta_e_pct': model_result['delta_e_pct'],
                    'total_reduction': round(baseline_avg - adjusted_avg, 2),
                    'yearly_baseline_total': round(baseline_yearly_total, 2),
                    'yearly_adjusted_total': round(adjusted_yearly_total, 2),
                    'yearly_savings': round(baseline_yearly_total - adjusted_yearly_total, 2)
                },
                'applied_policies': applied_policies,
                'data_points': len(baseline_forecasts),
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/policies/report', methods=['POST'])
    def generate_policy_report():
        """
        Generate and download a formatted policy simulation report.
        
        Request body:
        {
            "policy_ids": ["odd-even", "grap-stage-3"],
            "year": 2026
        }
        
        Returns a downloadable text file.
        """
        try:
            from policies_data import calculate_delta_e, get_model_metadata
            from flask import Response
            
            data = request.json or {}
            policy_ids = data.get('policy_ids', [])
            year = data.get('year', 2026)
            
            if year not in [2026, 2027, 2028]:
                return jsonify({'error': 'Year must be 2026, 2027, or 2028'}), 400
            
            if not policy_ids:
                return jsonify({'error': 'No policies selected'}), 400
            
            # Load forecast data
            forecast_path = os.path.join(os.path.dirname(__file__), 'emission_forecast_3years_full.csv')
            df = pd.read_csv(forecast_path)
            df['Date'] = pd.to_datetime(df['Date'])
            df['Year'] = df['Date'].dt.year
            year_df = df[df['Year'] == year].copy()
            
            # Calculate model
            model_result = calculate_delta_e(policy_ids)
            combined_impacts = calculate_combined_impact(policy_ids)
            model_metadata = get_model_metadata()
            
            # Calculate statistics
            baseline_avg = year_df['Total_Emission'].mean()
            adjusted_values = []
            for _, row in year_df.iterrows():
                total = 0
                for sector in ['Aviation', 'Ground_Transport', 'Industry', 'Power', 'Residential']:
                    impact = combined_impacts.get(sector, 0)
                    total += row[sector] * (1 + impact)
                adjusted_values.append(total)
            adjusted_avg = sum(adjusted_values) / len(adjusted_values)
            yearly_baseline = year_df['Total_Emission'].sum()
            yearly_adjusted = sum(adjusted_values)
            
            # Get policy names
            policy_names = []
            for pid in policy_ids:
                policy = get_policy_by_id(pid)
                if policy:
                    policy_names.append(f"{policy['icon']} {policy['name']}")
            
            # Generate report
            now = datetime.now()
            report = f"""======================================================================
            POLICY IMPACT SIMULATION REPORT - {year}
======================================================================

Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}
Forecast Year: {year}
Policies Applied: {', '.join(policy_names)}
Data Points: {len(year_df)} days

----------------------------------------------------------------------
                        SUMMARY STATISTICS
----------------------------------------------------------------------

  Baseline Daily Average:     {baseline_avg:.2f} kt CO2
  With Policy Average:        {adjusted_avg:.2f} kt CO2
  Daily Reduction:            {baseline_avg - adjusted_avg:.2f} kt CO2
  Percentage Change:          {((adjusted_avg - baseline_avg) / baseline_avg * 100):.2f}%

  Yearly Baseline Total:      {yearly_baseline / 1000:.2f} Mt CO2
  Yearly With Policy:         {yearly_adjusted / 1000:.2f} Mt CO2
  Yearly Savings:             {(yearly_baseline - yearly_adjusted) / 1000:.2f} Mt CO2

----------------------------------------------------------------------
                     SECTOR IMPACT BREAKDOWN
----------------------------------------------------------------------

  Sector                      Impact         Change
  ------------------------------------------------------------------
"""
            for sector, impact in combined_impacts.items():
                direction = 'Reduction' if impact < 0 else 'Increase' if impact > 0 else 'No Change'
                report += f"  {sector.replace('_', ' '):<25} {impact * 100:>8.1f}%     {direction}\n"
            
            report += f"""
----------------------------------------------------------------------
               REDUCED-FORM MODEL CALCULATION
----------------------------------------------------------------------

  Model: {model_metadata['model_name']}
  Formula: Delta E = D x Sum Bi x (ai/100)
  Calibration Constant (D): {model_result['calibration_d']}
  
  SECTOR CONTRIBUTIONS:
  ------------------------------------------------------------------
  Sector                  Weight(Bi)  Reduction(ai)  Contribution
  ------------------------------------------------------------------
"""
            for sector, weight in model_result['sector_weights'].items():
                reduction = model_result['combined_reductions'].get(sector, 0)
                contribution = model_result['sector_contributions'].get(sector, 0)
                report += f"  {sector.replace('_', ' '):<22} {weight:>8.4f}   {reduction:>10.1f}%   {contribution:>12.6f}\n"
            
            report += f"""  ------------------------------------------------------------------
  TOTAL CONTRIBUTION (Sum):                        {model_result['total_contribution']:.6f}
  
  CALCULATION:
  {model_result['formula']}
  
  PROPORTIONAL CHANGE (Delta E): {model_result['delta_e_pct']:.2f}% relative to BAU baseline

----------------------------------------------------------------------
                         INTERPRETATION
----------------------------------------------------------------------

  {model_metadata['interpretation']}

----------------------------------------------------------------------
                      APPLIED POLICIES DETAIL
----------------------------------------------------------------------

"""
            for i, name in enumerate(policy_names, 1):
                report += f"  {i}. {name}\n"
            
            report += """
======================================================================
                         END OF REPORT
======================================================================
"""
            
            # Return as downloadable file
            filename = f"policy_simulation_{year}_report.txt"
            response = Response(
                report,
                mimetype='text/plain',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Type': 'text/plain; charset=utf-8'
                }
            )
            return response
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
            
    @app.route('/api/policies/chat', methods=['POST'])
    def policy_chat():
        """
        Chat with Gemini about selected policies.
        """
        try:
            from policy_chat import PolicyChat
            from policies_data import get_policy_by_id
            
            data = request.json or {}
            policy_ids = data.get('policy_ids', [])
            question = data.get('question', '')
            
            if not question:
                return jsonify({'error': 'Question is required'}), 400
                
            # Get full policy details
            policies = []
            for pid in policy_ids:
                p = get_policy_by_id(pid)
                if p:
                    policies.append(p)
            
            chat_engine = PolicyChat()
            answer = chat_engine.chat(policies, question)
            
            return jsonify({
                'status': 'success',
                'answer': answer,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/policies/economic-report', methods=['POST'])
    def generate_economic_report():
        """
        Generate and download a detailed economic impact report for selected policies.
        
        Request body:
        {
            "policy_ids": ["odd-even", "grap-stage-3"],
            "year": 2026
        }
        
        Returns a downloadable text file.
        """
        try:
            from flask import Response
            
            data = request.json or {}
            policy_ids = data.get('policy_ids', [])
            year = data.get('year', 2026)
            
            if not policy_ids:
                return jsonify({'error': 'No policies selected'}), 400
            
            # Gather policy data with economics
            policies = []
            total_impl_cost = 0
            total_annual_savings = 0
            total_health_benefits = 0
            total_carbon_credits = 0
            total_jobs_affected = 0
            total_productivity_loss = 0
            total_enforcement_cost = 0
            
            for pid in policy_ids:
                policy = get_policy_by_id(pid)
                if policy:
                    policies.append(policy)
                    econ = policy.get('economic_data', {})
                    total_impl_cost += econ.get('implementation_cost_cr', 0)
                    total_annual_savings += econ.get('annual_savings_cr', 0)
                    total_health_benefits += econ.get('health_benefits_cr', 0)
                    total_carbon_credits += econ.get('carbon_credit_value_cr', 0)
                    total_jobs_affected += econ.get('jobs_affected', 0)
                    total_productivity_loss += econ.get('productivity_loss_cr', 0)
                    total_enforcement_cost += econ.get('enforcement_cost_cr', 0)
            
            if not policies:
                return jsonify({'error': 'No valid policies found'}), 400
            
            # Calculate net benefit
            net_annual_benefit = total_annual_savings + total_health_benefits + total_carbon_credits - total_productivity_loss - total_enforcement_cost
            roi_simple = (net_annual_benefit / total_impl_cost * 100) if total_impl_cost > 0 else 0
            payback_years = (total_impl_cost / net_annual_benefit) if net_annual_benefit > 0 else float('inf')
            
            # Generate report
            now = datetime.now()
            policy_names = ', '.join([f"{p['icon']} {p['name']}" for p in policies])
            
            report = f"""======================================================================
             ECONOMIC IMPACT ANALYSIS REPORT - {year}
======================================================================

Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}
Analysis Year: {year}
Policies Analyzed: {len(policies)}

----------------------------------------------------------------------
                      POLICIES INCLUDED
----------------------------------------------------------------------

"""
            for i, p in enumerate(policies, 1):
                report += f"  {i}. {p['icon']} {p['name']} ({p['category']})\n"
            
            report += f"""
----------------------------------------------------------------------
                    EXECUTIVE SUMMARY
----------------------------------------------------------------------

  Total Implementation Cost:     ₹{total_impl_cost:,.0f} Crores
  Total Annual Savings:          ₹{total_annual_savings:,.0f} Crores
  Net Annual Benefit:            ₹{net_annual_benefit:,.0f} Crores
  Simple ROI:                    {roi_simple:.1f}%
  Payback Period:                {payback_years:.1f} years

----------------------------------------------------------------------
                  DETAILED COST BREAKDOWN
----------------------------------------------------------------------

  COSTS:
  ------------------------------------------------------------------
  Implementation Cost:           ₹{total_impl_cost:,.0f} Cr
  Enforcement Cost:              ₹{total_enforcement_cost:,.0f} Cr/year
  Productivity Loss:             ₹{total_productivity_loss:,.0f} Cr/year
  ------------------------------------------------------------------
  Total Annual Costs:            ₹{total_enforcement_cost + total_productivity_loss:,.0f} Cr

  BENEFITS:
  ------------------------------------------------------------------
  Annual Savings (Fuel/Energy):  ₹{total_annual_savings:,.0f} Cr/year
  Health Benefits:               ₹{total_health_benefits:,.0f} Cr/year
  Carbon Credit Value:           ₹{total_carbon_credits:,.0f} Cr/year
  ------------------------------------------------------------------
  Total Annual Benefits:         ₹{total_annual_savings + total_health_benefits + total_carbon_credits:,.0f} Cr

----------------------------------------------------------------------
                  EMPLOYMENT IMPACT
----------------------------------------------------------------------

  Jobs Affected:                 {abs(total_jobs_affected):,}
  Impact Type:                   {'Job Creation' if total_jobs_affected < 0 else 'Job Displacement'}
  
  Note: Negative values indicate job creation; positive values
  indicate temporary job displacement during policy implementation.

----------------------------------------------------------------------
                  POLICY-WISE BREAKDOWN
----------------------------------------------------------------------

"""
            for p in policies:
                econ = p.get('economic_data', {})
                report += f"""  {p['icon']} {p['name']}
  ------------------------------------------------------------------
    Implementation Cost:         ₹{econ.get('implementation_cost_cr', 0):,.0f} Cr
    Annual Savings:              ₹{econ.get('annual_savings_cr', 0):,.0f} Cr
    Health Benefits:             ₹{econ.get('health_benefits_cr', 0):,.0f} Cr
    Carbon Credits:              ₹{econ.get('carbon_credit_value_cr', 0):,.0f} Cr
    GDP Impact:                  {econ.get('gdp_impact_percent', 0):+.1f}%
    ROI Timeline:                {econ.get('roi_years', 0):.1f} years
    Jobs Affected:               {econ.get('jobs_affected', 0):,}

"""
            
            report += f"""----------------------------------------------------------------------
                      RECOMMENDATIONS
----------------------------------------------------------------------

  1. COST-EFFECTIVENESS: {'HIGH' if roi_simple > 50 else 'MEDIUM' if roi_simple > 20 else 'LOW'}
     The selected policies show a {roi_simple:.1f}% return on investment.
     
  2. PAYBACK ANALYSIS:
     Initial investment recovers in {payback_years:.1f} years through
     combined health, environmental, and economic benefits.
     
  3. HEALTH IMPACT:
     Healthcare cost savings of ₹{total_health_benefits:,.0f} Cr annually
     from reduced respiratory diseases and hospitalizations.
     
  4. ENVIRONMENTAL VALUE:
     Carbon credits worth ₹{total_carbon_credits:,.0f} Cr annually
     can be traded in domestic/international markets.

----------------------------------------------------------------------
                      DISCLAIMER
----------------------------------------------------------------------

  This economic analysis uses modeled estimates based on:
  - Historical policy implementation data
  - Sector-specific emission reduction factors
  - Standard health cost valuations
  - Current carbon credit market rates
  
  Actual costs and benefits may vary based on implementation
  efficiency, market conditions, and compliance levels.

======================================================================
                       END OF REPORT
======================================================================
"""
            
            # Return as downloadable file
            filename = f"economic_impact_{year}_report.txt"
            response = Response(
                report,
                mimetype='text/plain',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Type': 'text/plain; charset=utf-8'
                }
            )
            return response
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    print("Training XGBoost Emission Model...")
    try:
        forecaster = EmissionForecaster()
        print("\nModel Trained Successfully!")
        print("-" * 30)
        print("Performance Metrics (Test Set):")
        for metric, value in forecaster.metrics.items():
            print(f"  {metric.upper()}: {value}")
        print("-" * 30)
        
        # Optional: Print a sample forecast
        print("\nSample 5-Day Forecast:")
        forecast = forecaster.forecast_days(5)
        for day in forecast['forecasts']:
            print(f"  {day['date']}: {day['emission']} tonnes CO2")
            
    except Exception as e:
        print(f"\nError: {e}")
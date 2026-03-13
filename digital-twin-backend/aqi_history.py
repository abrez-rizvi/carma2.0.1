import pandas as pd
import numpy as np
import os
from flask import jsonify, request
from datetime import datetime, timedelta

# Try importing XGBoost
try:
    from xgboost import XGBRegressor
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    HAS_MODEL = True
except ImportError:
    HAS_MODEL = False

# Global instance
_aqi_history = None

class AQIHistory:
    def __init__(self, data_path='AQI_Combined.csv'):
        self.data_path = data_path
        self.df = None
        self.model = None
        self.metrics = {}
        self._load_data()
        
        if HAS_MODEL and self.df is not None and not self.df.empty:
            self._train_model()
    
    def _load_data(self):
        if os.path.exists(self.data_path):
            try:
                self.df = pd.read_csv(self.data_path)
                # Parse date - format is DD-MM-YYYY based on user input
                self.df['Date'] = pd.to_datetime(self.df['Date'], format='%d-%m-%Y')
                self.df = self.df.sort_values('Date').dropna()
            except Exception as e:
                print(f"Error loading AQI history: {e}")
                self.df = pd.DataFrame()
        else:
            print(f"AQI history file not found: {self.data_path}")
            self.df = pd.DataFrame()

    def get_history(self, start_year=None, end_year=None):
        if self.df is None or self.df.empty:
            return []
            
        data = self.df.copy()
        
        if start_year:
            data = data[data['Date'].dt.year >= start_year]
        if end_year:
            data = data[data['Date'].dt.year <= end_year]
            
        # Return raw daily data instead of monthly averages
        # This ensures the values match the CSV exactly as requested by the user
        
        return [
            {
                'date': row['Date'].strftime('%Y-%m-%d'),
                'aqi': int(row['AQI'])
            }
            for _, row in data.iterrows()
        ]

    def _create_features(self, data):
        df_feat = data.copy()
        target_col = 'AQI'
        
        # Time features
        df_feat['day_of_week'] = df_feat['Date'].dt.dayofweek
        df_feat['month'] = df_feat['Date'].dt.month
        df_feat['day_of_year'] = df_feat['Date'].dt.dayofyear
        
        # Seasonality (Cyclical)
        df_feat['day_year_sin'] = np.sin(2 * np.pi * df_feat['day_of_year'] / 365.25)
        df_feat['day_year_cos'] = np.cos(2 * np.pi * df_feat['day_of_year'] / 365.25)
        df_feat['month_sin'] = np.sin(2 * np.pi * df_feat['month'] / 12)
        df_feat['month_cos'] = np.cos(2 * np.pi * df_feat['month'] / 12)
        
        # Lags (Extended for long-term dependency)
        # 365 lag is crucial for year-over-year patterns
        lags = [1, 2, 3, 7, 14, 30, 60, 90, 365]
        for lag in lags:
            df_feat[f'lag_{lag}'] = df_feat[target_col].shift(lag)
            
        # Rolling stats
        for window in [7, 30, 90]:
            df_feat[f'rolling_mean_{window}'] = df_feat[target_col].shift(1).rolling(window=window).mean()
            df_feat[f'rolling_std_{window}'] = df_feat[target_col].shift(1).rolling(window=window).std()
            
        return df_feat.dropna()

    def _train_model(self):
        print("Training AQI Forecast Model (XGBoost)...")
        try:
            df_feat = self._create_features(self.df)
            
            features = [c for c in df_feat.columns if c not in ['Date', 'AQI']]
            X = df_feat[features].values
            y = df_feat['AQI'].values
            
            # Split
            # Use last 365 days as test set
            split_idx = len(X) - 365
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
            
            self.model = XGBRegressor(
                n_estimators=1000,
                learning_rate=0.05,
                max_depth=6,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train, y_train)
            
            # Metrics
            preds = self.model.predict(X_test)
            mae = mean_absolute_error(y_test, preds)
            mse = mean_squared_error(y_test, preds)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, preds)
            
            self.metrics = {
                'mae': float(mae),
                'mse': float(mse),
                'rmse': float(rmse),
                'r2': float(r2)
            }
            print(f"AQI XGB Model trained. MAE: {mae:.2f}, R2: {r2:.2f}")
            
        except Exception as e:
            print(f"Error training AQI model: {e}")

    def forecast_days(self, n_days=180):
        if not HAS_MODEL or self.df is None or self.df.empty:
            return {'error': 'Model not trained'}
            
        future_dates = []
        last_date = self.df['Date'].iloc[-1]
        
        # Calculate gap to today
        today = pd.Timestamp.now().normalize()
        gap_days = (today - last_date).days
        
        # We want to fill the gap AND predict n_days into the future
        total_days = max(0, gap_days) + n_days
        
        print(f"Bridging gap of {gap_days} days + Forecasting {n_days} days. Total: {total_days}")
        
        # We need to iteratively predict because of lags
        # Start with the last known data window
        current_data = self.df.copy()
        
        predictions = []
        
        for i in range(total_days):
            next_date = last_date + timedelta(days=i+1)
            
            # Create a temporary row for feature engineering
            temp_df = pd.concat([
                current_data,
                pd.DataFrame({'Date': [next_date], 'AQI': [0]}) # Dummy AQI
            ], ignore_index=True)
            
            feats_df = self._create_features(temp_df)
            if feats_df.empty:
                break
                
            # Get the features for the last row (the one we want to predict)
            last_row_feats = feats_df.iloc[-1]
            features_cols = [c for c in feats_df.columns if c not in ['Date', 'AQI']]
            
            X_pred = last_row_feats[features_cols].values.reshape(1, -1)
            pred_aqi = float(self.model.predict(X_pred)[0])
            pred_aqi = max(0, pred_aqi) # AQI can't be negative
            
            predictions.append({
                'date': next_date.strftime('%Y-%m-%d'),
                'aqi': int(round(pred_aqi))
            })
            
            # Append prediction to current_data for next iteration's lags
            current_data = pd.concat([
                current_data,
                pd.DataFrame({'Date': [next_date], 'AQI': [pred_aqi]})
            ], ignore_index=True)

        return {
            'forecast': predictions,
            'metrics': self.metrics
        }

def get_aqi_history():
    global _aqi_history
    if _aqi_history is None:
        _aqi_history = AQIHistory()
    return _aqi_history

def register_aqi_history_routes(app):
    @app.route('/api/aqi/history', methods=['GET'])
    def api_aqi_history():
        try:
            handler = get_aqi_history()
            trends = handler.get_history()
            return jsonify({
                'status': 'success',
                'data': trends
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/aqi/forecast', methods=['POST'])
    def api_aqi_forecast():
        try:
            data = request.json or {}
            days = data.get('days', 30)
            
            handler = get_aqi_history()
            result = handler.forecast_days(days)
            
            return jsonify({
                'status': 'success',
                'data': result
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    print("Initialize AQI History and Training Model...")
    try:
        handler = AQIHistory()
        if handler.model:
            print("\nModel Trained Successfully!")
            print("-" * 30)
            print("Performance Metrics (Test Set):")
            for metric, value in handler.metrics.items():
                print(f"  {metric.upper()}: {value:.4f}")
            print("-" * 30)
            
            print("\nSample 5-Day Forecast:")
            forecast_result = handler.forecast_days(5)
            if 'forecast' in forecast_result:
                for day in forecast_result['forecast']:
                    print(f"  {day['date']}: {day['aqi']} (AQI)")
        else:
            print("Model failed to train or Scikit-learn not installed.")
            
    except Exception as e:
        print(f"\nError: {e}")

import pandas as pd
import numpy as np
from sklearn.linear_model import RidgeCV, LassoCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
import warnings
import os

warnings.filterwarnings('ignore')

class EmissionForecaster:
    def __init__(self, data_path='new_daily_emissions_column_format.xlsx'):
        self.data_path = data_path
        self.target_col = 'Total Emissions'
        self.sector_cols = ['Aviation (%)', 'Ground Transport (%)', 'Industry (%)', 'Power (%)', 'Residential (%)']
        self.performance_metrics = {}
        
        if os.path.exists(data_path):
            self._train_model()

    def _create_features(self, df):
        df = df.copy()
        df = df.dropna(subset=['Date', self.target_col])
        df = df.sort_values('Date').reset_index(drop=True)
        
        # 1. Trend & Cyclical Features
        df['time_index'] = np.arange(len(df))
        df['month_sin'] = np.sin(2 * np.pi * df['Date'].dt.month / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['Date'].dt.month / 12)
        df['dow_sin'] = np.sin(2 * np.pi * df['Date'].dt.dayofweek / 7)
        df['dow_cos'] = np.cos(2 * np.pi * df['Date'].dt.dayofweek / 7)
        
        # 2. Optimized Lags & Rolling
        for lag in [1, 7]:
            df[f'lag_{lag}'] = df[self.target_col].shift(lag)
        df['roll_mean_7'] = df[self.target_col].shift(1).rolling(window=7).mean()
        
        return df.dropna().reset_index(drop=True)

    def _train_model(self):
        df_raw = pd.read_excel(self.data_path)
        df_raw['Date'] = pd.to_datetime(df_raw['Date'], dayfirst=True)
        self.avg_sectors = df_raw[self.sector_cols].mean().to_dict()
        
        df_feat = self._create_features(df_raw)
        self.df_features = df_feat
        
        # Consistent feature set
        self.feature_cols = ['time_index', 'month_sin', 'month_cos', 'dow_sin', 'dow_cos', 'lag_1', 'lag_7', 'roll_mean_7']
        X = df_feat[self.feature_cols].values
        y = df_feat[self.target_col].values
        
        # 80-20 Split
        split_idx = int(len(X) * 0.80)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Base Models with High Regularization
        base_models = [
            ('lasso', LassoCV(cv=5)),
            ('rf', RandomForestRegressor(n_estimators=100, max_depth=2, random_state=42)),
            ('xgb', XGBRegressor(n_estimators=100, max_depth=1, learning_rate=0.05, reg_lambda=100, random_state=42))
        ]
        
        train_preds, test_preds, trained_pipes = [], [], []
        for name, model in base_models:
            pipe = Pipeline([('scaler', StandardScaler()), ('model', model)])
            pipe.fit(X_train, y_train)
            trained_pipes.append(pipe)
            train_preds.append(pipe.predict(X_train))
            test_preds.append(pipe.predict(X_test))
            
        # Meta-model (RidgeCV auto-tunes the best regularization)
        meta_model = RidgeCV(alphas=[10, 50, 100, 200, 500])
        meta_model.fit(np.column_stack(train_preds), y_train)
        self.model = {'base': trained_pipes, 'meta': meta_model}
        
        # Full Performance Evaluation
        y_tr_pred = meta_model.predict(np.column_stack(train_preds))
        y_ts_pred = meta_model.predict(np.column_stack(test_preds))
        
        self.performance_metrics = {
            'train': {
                'r2': round(r2_score(y_train, y_tr_pred), 4),
                'mae': round(mean_absolute_error(y_train, y_tr_pred), 4),
                'rmse': round(np.sqrt(mean_squared_error(y_train, y_tr_pred)), 4)
            },
            'test': {
                'r2': round(r2_score(y_test, y_ts_pred), 4),
                'mae': round(mean_absolute_error(y_test, y_ts_pred), 4),
                'rmse': round(np.sqrt(mean_squared_error(y_test, y_ts_pred)), 4)
            }
        }

    def forecast_days(self, n_days):
        recent_emissions = self.df_features[self.target_col].values.tolist()
        last_date = self.df_features['Date'].iloc[-1]
        last_idx = self.df_features['time_index'].iloc[-1]
        forecasts = []
        
        for i in range(1, n_days + 1):
            f_date = last_date + pd.Timedelta(days=i)
            feat_vals = [
                last_idx + i, # time_index
                np.sin(2 * np.pi * f_date.month / 12), np.cos(2 * np.pi * f_date.month / 12),
                np.sin(2 * np.pi * f_date.dayofweek / 7), np.cos(2 * np.pi * f_date.dayofweek / 7),
                recent_emissions[-1], recent_emissions[-7], np.mean(recent_emissions[-7:])
            ]
            
            X_ptr = np.array(feat_vals).reshape(1, -1)
            base_p = [m.predict(X_ptr)[0] for m in self.model['base']]
            pred = self.model['meta'].predict(np.array(base_p).reshape(1, -1))[0]
            
            recent_emissions.append(pred)
            sects = {k.replace(' (%)','').replace(' ','_'): round(pred * v / 100, 4) for k, v in self.avg_sectors.items()}
            forecasts.append({'Date': f_date, 'Total_Emission': round(pred, 4), **sects})
            
        return pd.DataFrame(forecasts)

if __name__ == "__main__":
    obj = EmissionForecaster()
    
    # 1. Full Performance Table
    m = obj.performance_metrics
    print("\n" + " COMPLETE MODEL PERFORMANCE ".center(60, "="))
    print(f"{'Metric':<15} | {'Training Set':<15} | {'Test Set':<15}")
    print("-" * 60)
    print(f"{'R2 Score':<15} | {m['train']['r2']:<15} | {m['test']['r2']:<15}")
    print(f"{'MAE':<15} | {m['train']['mae']:<15} | {m['test']['mae']:<15}")
    print(f"{'RMSE':<15} | {m['train']['rmse']:<15} | {m['test']['rmse']:<15}")
    print("="*60)

    # 2. Generate and Split CSVs
    days = 1096  # 2026-2028
    print(f"\nGenerating and splitting forecast for {days} days...")
    forecast_df = obj.forecast_days(days)
    
    # Save Full View (Predicted only)
    full_csv = forecast_df.copy()
    full_csv['Date'] = full_csv['Date'].dt.strftime('%Y-%m-%d')
    full_csv.to_csv("emission_forecast_3years_full.csv", index=False)
    print("1. Saved: emission_forecast_3years_full.csv")

    # Save Individual Years
    for yr in [2026, 2027, 2028]:
        year_data = forecast_df[forecast_df['Date'].dt.year == yr].copy()
        year_data['Date'] = year_data['Date'].dt.strftime('%Y-%m-%d')
        year_data = year_data[['Date', 'Total_Emission', 'Aviation', 'Ground_Transport', 'Industry', 'Power', 'Residential']]
        year_data.to_csv(f"emission_forecast_{yr}.csv", index=False)
        print(f"   Generated: emission_forecast_{yr}.csv")

    print("\n" + " SUCCESS: ALL FILES SAVED ".center(60, "="))
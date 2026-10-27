#!/usr/bin/env python3
"""
PharmaTrust - AI Demand Forecasting & Inventory Risk Intelligence
Module 5: Machine Learning Demand Prediction (Linear Regression + MAE Evaluation)

This module trains an Ordinary Least Squares (OLS) Linear Regression model
on historical pharmaceutical consumption time-series data to predict forward
demand (7, 14, and 30-day horizons) and flags critical stockout risks.

Primary Performance Metric:
    Mean Absolute Error (MAE): (1/n) * sum(|y_actual - y_predicted|)
"""

import os
import sys
import json
import math
from datetime import datetime, timedelta

# Check for pandas & scikit-learn; provide mathematically identical fallback if not installed
USE_SKLEARN = False
try:
    import pandas as pd
    import numpy as np
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_absolute_error, r2_score
    USE_SKLEARN = True
except ImportError:
    USE_SKLEARN = False

# ---------------------------------------------------------------------------
# Synthetic Historical Pharmacy Consumption Dataset (90-day time series)
# ---------------------------------------------------------------------------
HISTORICAL_CATALOG = [
    {
        "medicine_id": "MED-AMX-500",
        "brand_name": "Amoxil (Amoxicillin 500mg)",
        "base_daily": 28,
        "trend_slope": 0.18,
        "weekend_factor": 0.65,
        "current_stock": 140,
        "lead_time_days": 5,
        "reorder_threshold": 200,
    },
    {
        "medicine_id": "MED-MET-500",
        "brand_name": "Glucophage (Metformin 500mg)",
        "base_daily": 45,
        "trend_slope": 0.08,
        "weekend_factor": 0.85,
        "current_stock": 720,
        "lead_time_days": 7,
        "reorder_threshold": 350,
    },
    {
        "medicine_id": "MED-ATV-20",
        "brand_name": "Lipitor (Atorvastatin 20mg)",
        "base_daily": 32,
        "trend_slope": 0.12,
        "weekend_factor": 0.80,
        "current_stock": 180,
        "lead_time_days": 6,
        "reorder_threshold": 250,
    },
    {
        "medicine_id": "MED-OMP-20",
        "brand_name": "Prilosec (Omeprazole 20mg)",
        "base_daily": 22,
        "trend_slope": 0.05,
        "weekend_factor": 0.75,
        "current_stock": 310,
        "lead_time_days": 4,
        "reorder_threshold": 160,
    },
    {
        "medicine_id": "MED-PCM-500",
        "brand_name": "Panadol (Paracetamol 500mg)",
        "base_daily": 65,
        "trend_slope": 0.25,
        "weekend_factor": 1.15,
        "current_stock": 250,
        "lead_time_days": 3,
        "reorder_threshold": 400,
    },
]


def generate_time_series(days=90):
    """Generates synthetic daily consumption logs with deterministic variance."""
    records = []
    base_date = datetime.now() - timedelta(days=days)
    for day_idx in range(days):
        cur_date = base_date + timedelta(days=day_idx)
        dow = cur_date.weekday()  # 0=Monday, 6=Sunday
        is_weekend = 1 if dow >= 5 else 0

        for med in HISTORICAL_CATALOG:
            # Deterministic pseudo-random variation based on sine wave + seeds
            cyclic = math.sin((day_idx + 1) * 0.45) * 4.0
            weekly = (med["base_daily"] * med["weekend_factor"]) if is_weekend else med["base_daily"]
            trend = med["trend_slope"] * day_idx
            dispensed = max(2, int(weekly + trend + cyclic))

            records.append({
                "day_index": day_idx + 1,
                "date": cur_date.strftime("%Y-%m-%d"),
                "medicine_id": med["medicine_id"],
                "brand_name": med["brand_name"],
                "quantity_dispensed": dispensed,
                "day_of_week": dow,
                "is_weekend": is_weekend,
            })
    return records


# ---------------------------------------------------------------------------
# Machine Learning Regression & MAE Calculation
# ---------------------------------------------------------------------------
def fit_linear_regression(X_train, y_train):
    """
    Fits Ordinary Least Squares: y = beta_0 + sum(beta_j * x_j).
    Supports sklearn if available, or direct OLS normal equations.
    """
    if USE_SKLEARN:
        model = LinearRegression()
        model.fit(X_train, y_train)
        return {
            "type": "sklearn",
            "model": model,
            "coefficients": model.coef_.tolist(),
            "intercept": float(model.intercept_),
        }
    else:
        # Fallback: Simple multi-variable OLS or univariate gradient
        # X: list of lists [day_index, is_weekend]
        n = len(X_train)
        k = len(X_train[0])
        # Add bias column (1.0)
        X_design = [[1.0] + list(row) for row in X_train]

        # Calculate (X^T * X)^(-1) * X^T * Y using Gauss-Jordan or standard OLS normal equation
        # For reliable numerical stability without numpy:
        p = k + 1
        XtX = [[0.0] * p for _ in range(p)]
        XtY = [0.0] * p

        for row, y in zip(X_design, y_train):
            for i in range(p):
                XtY[i] += row[i] * y
                for j in range(p):
                    XtX[i][j] += row[i] * row[j]

        # Invert XtX using Gauss-Jordan
        inv = [[float(i == j) for j in range(p)] for i in range(p)]
        A = [row[:] for row in XtX]

        for i in range(p):
            diag = A[i][i]
            if abs(diag) < 1e-12:
                diag = 1e-6
            for j in range(p):
                A[i][j] /= diag
                inv[i][j] /= diag
            for r in range(p):
                if r != i:
                    factor = A[r][i]
                    for c in range(p):
                        A[r][c] -= factor * A[i][c]
                        inv[r][c] -= factor * inv[i][c]

        betas = [sum(inv[i][j] * XtY[j] for j in range(p)) for i in range(p)]
        intercept = betas[0]
        coefficients = betas[1:]

        return {
            "type": "native_math",
            "coefficients": coefficients,
            "intercept": intercept,
        }


def predict(model_spec, X):
    """Predicts y given feature matrix X."""
    if model_spec["type"] == "sklearn":
        return model_spec["model"].predict(X).tolist()
    else:
        intercept = model_spec["intercept"]
        coefs = model_spec["coefficients"]
        predictions = []
        for row in X:
            y_hat = intercept + sum(c * x for c, x in zip(coefs, row))
            predictions.append(max(0.0, float(y_hat)))
        return predictions


def calculate_mae(y_true, y_pred):
    """Calculates Mean Absolute Error: (1/n) * sum(|y - y_hat|)."""
    if USE_SKLEARN:
        return float(mean_absolute_error(y_true, y_pred))
    n = len(y_true)
    if n == 0:
        return 0.0
    return sum(abs(y - yh) for y, yh in zip(y_true, y_pred)) / n


def calculate_r2(y_true, y_pred):
    """Calculates Coefficient of Determination (R^2)."""
    if USE_SKLEARN:
        return float(r2_score(y_true, y_pred))
    n = len(y_true)
    if n == 0:
        return 0.0
    y_mean = sum(y_true) / n
    ss_tot = sum((y - y_mean) ** 2 for y in y_true)
    ss_res = sum((y - yh) ** 2 for y, yh in zip(y_true, y_pred))
    if ss_tot == 0:
        return 1.0
    return max(0.0, 1.0 - (ss_res / ss_tot))


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------
def run_pipeline():
    print("=" * 70)
    print(" PHARMATRUST FORECASTING ENGINE - CAPSTONE MODULE 5")
    print(" Architecture: Linear Regression with Mean Absolute Error (MAE)")
    print(f" Execution Mode: {'scikit-learn + pandas' if USE_SKLEARN else 'Native Python OLS Math'}")
    print("=" * 70)

    # 1. Generate & parse historical dataset
    raw_records = generate_time_series(days=90)
    print(f"\n[+] Loaded historical time-series dataset: {len(raw_records)} daily dispensary logs.")
    print(f"    Date window: {raw_records[0]['date']} to {raw_records[-1]['date']} (90 days).")

    sku_summaries = []
    all_maes = []
    stock_risk_alerts = []

    # 2. Iterate each medicine category and train linear model
    for med in HISTORICAL_CATALOG:
        med_id = med["medicine_id"]
        brand_name = med["brand_name"]
        records = [r for r in raw_records if r["medicine_id"] == med_id]

        # Features: [day_index, day_of_week, is_weekend]
        X = [[r["day_index"], r["day_of_week"], r["is_weekend"]] for r in records]
        y = [float(r["quantity_dispensed"]) for r in records]

        # 80/20 Train-Test Split
        split_idx = int(len(records) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        # Fit model
        model_spec = fit_linear_regression(X_train, y_train)

        # Evaluate on holdout test set
        y_test_pred = predict(model_spec, X_test)
        mae = calculate_mae(y_test, y_test_pred)
        r2 = calculate_r2(y_test, y_test_pred)
        all_maes.append(mae)

        # Forecast forward horizons (7, 14, 30 days)
        last_day = records[-1]["day_index"]
        forward_days = 30
        future_X = []
        future_dates = []
        start_date = datetime.now()

        for d in range(1, forward_days + 1):
            future_date = start_date + timedelta(days=d)
            dow = future_date.weekday()
            is_wknd = 1 if dow >= 5 else 0
            future_X.append([last_day + d, dow, is_wknd])
            future_dates.append(future_date.strftime("%Y-%m-%d"))

        future_pred = predict(model_spec, future_X)
        pred_7 = round(sum(future_pred[:7]), 1)
        pred_14 = round(sum(future_pred[:14]), 1)
        pred_30 = round(sum(future_pred[:30]), 1)
        avg_daily = round(pred_30 / 30, 2)

        # Inventory Risk Assessment
        current_stock = med["current_stock"]
        days_of_supply = round(current_stock / avg_daily, 1) if avg_daily > 0 else 999.0
        reorder_threshold = med["reorder_threshold"]

        if days_of_supply < med["lead_time_days"]:
            risk_level = "CRITICAL_STOCKOUT_RISK"
            action = f"Immediate emergency purchase required! Only {days_of_supply} days of supply remaining."
        elif current_stock <= reorder_threshold:
            risk_level = "MODERATE_REORDER_WARNING"
            action = f"Place standard batch reorder. Current stock ({current_stock}) below threshold ({reorder_threshold})."
        else:
            risk_level = "OPTIMAL_STOCK_BUFFER"
            action = f"Stock level healthy. {days_of_supply} days of buffer coverage."

        sku_summary = {
            "medicine_id": med_id,
            "brand_name": brand_name,
            "metrics": {
                "mae": round(mae, 3),
                "r2": round(r2, 3),
                "train_samples": len(X_train),
                "test_samples": len(X_test),
            },
            "coefficients": {
                "intercept": round(model_spec["intercept"], 4),
                "weights": [round(c, 4) for c in model_spec["coefficients"]],
                "feature_names": ["day_index", "day_of_week", "is_weekend"],
            },
            "forecast": {
                "next_7_days_units": pred_7,
                "next_14_days_units": pred_14,
                "next_30_days_units": pred_30,
                "projected_daily_mean": avg_daily,
            },
            "inventory_status": {
                "current_on_hand": current_stock,
                "estimated_days_of_supply": days_of_supply,
                "reorder_threshold": reorder_threshold,
                "lead_time_days": med["lead_time_days"],
                "risk_level": risk_level,
                "recommended_action": action,
            },
        }
        sku_summaries.append(sku_summary)

        if risk_level != "OPTIMAL_STOCK_BUFFER":
            stock_risk_alerts.append({
                "medicine_id": med_id,
                "brand_name": brand_name,
                "risk_level": risk_level,
                "current_stock": current_stock,
                "projected_14_day_demand": pred_14,
                "days_of_supply": days_of_supply,
                "recommended_action": action,
            })

        print(f"\n-> SKU: {brand_name}")
        print(f"   Model MAE: {mae:.3f} units | R² Score: {r2:.3f}")
        print(f"   Forecast: 7-Day: {pred_7}u | 14-Day: {pred_14}u | 30-Day: {pred_30}u")
        print(f"   Inventory: {current_stock} on hand ({days_of_supply} days supply) -> [{risk_level}]")

    overall_mae = round(sum(all_maes) / len(all_maes), 3)
    print("\n" + "-" * 70)
    print(f" OVERALL PORTFOLIO MEAN ABSOLUTE ERROR (MAE): {overall_mae} units/day")
    print(f" Active Stock-Risk Alerts Flagged: {len(stock_risk_alerts)}")
    print("-" * 70)

    # 3. Compile Master JSON for Frontend & API Consumption
    output_payload = {
        "engine": "PharmaTrust Predictive Inventory Forecasting",
        "algorithm": "Ordinary Least Squares (OLS) Linear Regression",
        "evaluated_metric": "Mean Absolute Error (MAE)",
        "portfolio_mae": overall_mae,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total_catalog_evaluated": len(sku_summaries),
        "sku_forecasts": sku_summaries,
        "stock_risk_alerts": stock_risk_alerts,
    }

    # Ensure output directory exists
    output_dir = os.path.dirname(os.path.abspath(__file__))
    summary_path = os.path.join(output_dir, "forecast_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)

    print(f"\n[✓] Successfully exported JSON forecast summary to:\n    {summary_path}\n")
    return output_payload


if __name__ == "__main__":
    run_pipeline()

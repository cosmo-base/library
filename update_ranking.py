import json
import os
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
    FilterExpression,
    FilterExpressionList,
    Filter,
)

# 環境変数から設定を読み込む（GitHub Secretsで設定します）
PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID")

def get_ga4_clicks():
    """GA4からGoogle Driveリンクのクリック数を取得する"""
    client = BetaAnalyticsDataClient()
    
    # 過去30日間のリンククリックイベント（outbound click）を集計
    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        dimensions=[Dimension(name="linkUrl")],
        metrics=[Metric(name="eventCount")],
        date_ranges=[DateRange(start_date="30daysAgo", end_date="today")],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name="eventName",
                string_filter=Filter.StringFilter(value="click")
            )
        )
    )
    
    response = client.run_report(request)
    
    # URLをキー、クリック数を値とする辞書を作成
    click_data = {}
    for row in response.rows:
        url = row.dimension_values[0].value
        count = int(row.metric_values[0].value)
        click_data[url] = count
        
    return click_data

def update_json(click_data):
    """data.jsonのviewsを書き換える"""
    with open('data.json', 'r', encoding='utf-8') as f:
        documents = json.load(f)
        
    for doc in documents:
        target_url = doc.get("url", "")
        # GA4のデータに該当URLのクリック数があれば更新、なければそのままか0
        if target_url in click_data:
            doc["views"] = click_data[target_url]
            
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(documents, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    print("GA4からデータを取得中...")
    clicks = get_ga4_clicks()
    print("data.jsonを更新中...")
    update_json(clicks)
    print("完了しました！")

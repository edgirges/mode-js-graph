/*
* Notes:
* -
* -
* -
*
* Questions:
* - Visual in Grafana is not loading right now, what would be the best to see?
   --> Johnny right now is using the barchart
* - 
* - 
*/



select
  to_char(day, 'YYYY-MM') as month,
  sum(display_impressions) as "MultiTouchImpressions",
  sum(impressions) as "Impressions",
  sum(clicks + views) as "Visits",
  sum(uniques) as "UsersReached",
  sum(media_spend + data_spend + platform_spend) as "TotalSpend",
  1.0 * sum(clicks + views) / NULLIF(sum(impressions), 0) as "ImpressionVisitRate",
  1.0 * sum(clicks + views) / NULLIF(sum(uniques), 0) as "UserVisitRate",
  1.0 * sum(impressions) / NULLIF(sum(uniques), 0) as "Frequency",
  sum(click_conversions + view_conversions) as "Conversions",
  1.0 * sum(click_conversions + view_conversions) / NULLIF(sum(uniques), 0) as "UserConversionRate",
  1.0 * sum(click_conversions + view_conversions) / NULLIF(sum(impressions), 0) as "ImpressionConversionRate",
  1.0 * sum(click_conversions + view_conversions) / NULLIF(sum(clicks + views), 0) as "ConversionRate",
  sum(
    media_spend + data_spend + platform_spend + legacy_spend
  ) as "Spend",
  1.0 * sum(
    media_spend + data_spend + platform_spend + legacy_spend
  ) / NULLIF(sum(click_conversions + view_conversions), 0) as "CPA",
  sum(existing_site_visitors) as "ExistingSiteVisitors",
  sum(new_site_visitors) as "NewSiteVisitors",
  sum(click_order_value + view_order_value) as "OrderValue",
  1.0 * sum(click_order_value + view_order_value) / NULLIF(
    sum(
      media_spend + data_spend + platform_spend + legacy_spend
    ),
    0
  ) as "ROAS",
  1.0 * (
    sum(click_order_value + view_order_value) - sum(
      media_spend + data_spend + platform_spend + legacy_spend
    )
  ) / NULLIF(
    sum(
      media_spend + data_spend + platform_spend + legacy_spend
    ),
    0
  ) as "ROI",
  sum(site_visitors) as "SiteVisitors",
  sum(new_users_reached) as "NewUsersReached",
  sum(existing_users_reached) as "ExistingUsersReached",
  sum(video_spend) as "TVSpend",
  1.0 * sum(
    media_spend + data_spend + platform_spend + legacy_spend
  ) / (sum(impressions) / 1000.0) as "SpendCPM",
  1.0 * sum(media_cost) / (sum(impressions) / 1000.0) as "CostCPM",
  1.0 * sum(
    media_spend + data_spend + platform_spend + legacy_spend
  ) / NULLIF(sum(clicks + views), 0) as "CostPerVisit",
  sum(view_viewed) as "ViewableImpressions",
  1.0 * sum(view_viewed) / NULLIF(sum(impressions), 0) as "ViewableImpressionRate",
  sum(clicks) as "Clicks",
  1.0 * sum(clicks) / NULLIF(sum(impressions), 0) as "ClickRate",
  sum(click_conversions) as "ClickConversions",
  1.0 * sum(click_conversions) / NULLIF(sum(impressions), 0) as "ClickConversionRate",
  sum(views) as "Views",
  1.0 * sum(views) / NULLIF(sum(impressions), 0) as "ViewRate",
  sum(view_conversions) as "ViewConversions",
  1.0 * sum(view_conversions) / NULLIF(sum(impressions), 0) as "ViewConversionRate",
  1.0 * sum(
    media_spend + data_spend + platform_spend + legacy_spend
  ) / NULLIF(sum(clicks), 0) "CostPerClick",
  1.0 * sum(
    media_spend + data_spend + platform_spend + legacy_spend
  ) / NULLIF(sum(views), 0) as "CostPerView" 
from
  sum_by_advertiser_by_day s
where
   day >= current_date - interval '24 month'  -- '2023-01-01' -- (date_part('year',CURRENT_DATE)::VARCHAR || '-01-01')::DATE
   --and s.advertiser_id != 34411 
group by
  1
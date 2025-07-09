/*
* Notes:
* -
* -
* -
*
* Questions:
* - 
* - 
* - 
*/


select
  -- $__timeGroupAlias(day, '1d'),
  day::DATE as "day" ,
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
  sum( media_spend + data_spend + platform_spend + legacy_spend ) - sum(video_spend) as "display_Spend",
  1.0 * sum(video_spend) / sum( media_spend + data_spend + platform_spend + legacy_spend ) as "TVSpend Ratio",
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
  100.0 * sum(views) / NULLIF(sum(impressions), 0) as "ViewRate",
  sum(view_conversions) as "ViewConversions",
  1.0 * sum(view_conversions) / NULLIF(sum(impressions), 0) as "ViewConversionRate",
  1.0 * sum(
    media_spend + data_spend + platform_spend + legacy_spend
  ) / NULLIF(sum(clicks), 0) "CostPerClick",
  1.0 * sum(
    media_spend + data_spend + platform_spend + legacy_spend
  ) / NULLIF(sum(views), 0) as "CostPerView" 
  --sum(view_viewed) as ViewableImpressions,
  --1.0 * sum(view_viewed) / NULLIF(sum(impressions), 0) as ViewableImpressionRate
from
  sum_by_campaign_by_day s
  join campaigns c using (campaign_id)
--  join objectives using (objective_id)
where 1=1
--  s.advertiser_id = 33163 and
--  c.campaign_group_id in (35073) and 
  -- and c.objective_id in ($obj_id ) 
  -- and c.channel_id in ($channel_id) 
   and s.advertiser_id != 34411
  -- and $__timeFilter(day)
  -- and day >= '2024-01-01' and day < current_date
   and day >= current_date - interval '7 day'
group by
  1 
--,2,3,4,5
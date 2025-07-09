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
  day,
  avg(sum(display_impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "MultiTouchImpressions",
  avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Impressions",
  avg(sum(clicks + views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Visits",
  avg(sum(uniques)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UsersReached",
  avg(sum(media_spend + data_spend + platform_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Total_Spend",
  1.0 * sum(sum(clicks + views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  as "ImpressionVisitRate",
  1.0 * sum(sum(clicks + views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UserVisitRate",
  1.0 * sum(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Frequency",
  avg(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Conversions",
  1.0 * sum(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UserConversionRate",
  1.0 * sum(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ImpressionConversionRate",
  1.0 * sum(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(clicks + views + COALESCE(competing_views,0)), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ConversionRate",
  avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "spend",
  1.0 * sum(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0)), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CPA",
  avg(sum(existing_site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ExistingSiteVisitors",
  avg(sum(new_site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "NewSiteVisitors",
  avg(sum(click_order_value + view_order_value + COALESCE(competing_view_order_value,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "OrderValue",
  1.0 * sum(sum(click_order_value + view_order_value + COALESCE(competing_view_order_value,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ROAS",
  1.0 * sum(sum(click_order_value + view_order_value + COALESCE(competing_view_order_value,0)) - sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ROI",
  avg(sum(site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "SiteVisitors",
  avg(sum(new_users_reached)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "NewUsersReached",
  avg(sum(existing_users_reached)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ExistingUsersReached",
  avg(sum(video_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "TVSpend",
  1.0 * sum(sum(media_spend + data_spend + platform_spend  + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) 
    / (sum(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) / 1000.0) as "SpendCPM",
  1.0 * sum(sum(media_cost)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) 
    / (sum(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) / 1000.0) as "CostCPM",  
  1.0 * sum(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(clicks + views + COALESCE(competing_views,0)), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CostPerVisit",
  avg(sum(view_viewed)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewableImpressions",
  1.0 * sum(sum(view_viewed)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewableImpressionRate",
  avg(sum(clicks)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "clicks",
  1.0 * sum(sum(clicks)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ClickRate",
  avg(sum(click_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "click_conversions",
  1.0 * sum(sum(click_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ClickConversionRate",
  avg(sum(views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "views",
  1.0 * sum(sum(views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewRate",
  avg(sum(view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewConversions",
  1.0 * sum(sum(view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewConversionRate",
  1.0 * sum(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(clicks), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) "CostPerClick",
  1.0 * sum(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(views + COALESCE(competing_views,0)), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CostPerView"
from
  sum_by_parent_campaign_group_by_day s
  join campaign_groups c using (campaign_group_id)
where 1=1
  -- and day >= '2024-04-01' and  day < current_date 
   and day >= current_date - interval '21 day' 
  -- and c.objective_id in ($obj_id )     
   and s.advertiser_id not in (34411, 32771, 36202)
  -- and $__timeFilter(s.day)
group by
  s.day
order by
  s.day
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
  day,
  avg(sum(display_impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "MultiTouchImpressions",
  avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Impressions",
  avg(sum(clicks + views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Visits",
  avg(sum(uniques)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UsersReached",
  avg(sum(media_spend + data_spend + platform_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Total_Spend",
  1.0 * sum(sum(clicks + views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  as "ImpressionVisitRate",
  1.0 * sum(sum(clicks + views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UserVisitRate",
  1.0 * sum(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Frequency",
  avg(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Conversions",
  1.0 * sum(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UserConversionRate",
  1.0 * sum(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ImpressionConversionRate",
  1.0 * sum(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(clicks + views + COALESCE(competing_views,0)), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ConversionRate",
  avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "spend",
  1.0 * sum(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(click_conversions + view_conversions + COALESCE(competing_view_conversions,0)), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CPA",
  avg(sum(existing_site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ExistingSiteVisitors",
  avg(sum(new_site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "NewSiteVisitors",
  avg(sum(click_order_value + view_order_value + COALESCE(competing_view_order_value,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "OrderValue",
  1.0 * sum(sum(click_order_value + view_order_value + COALESCE(competing_view_order_value,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ROAS",
  1.0 * sum(sum(click_order_value + view_order_value + COALESCE(competing_view_order_value,0)) - sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ROI",
  avg(sum(site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "SiteVisitors",
  avg(sum(new_users_reached)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "NewUsersReached",
  avg(sum(existing_users_reached)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ExistingUsersReached",
  avg(sum(video_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "TVSpend",
  1.0 * sum(sum(media_spend + data_spend + platform_spend  + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) 
    / (sum(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) / 1000.0) as "SpendCPM",
  1.0 * sum(sum(media_cost)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) 
    / (sum(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) / 1000.0) as "CostCPM",  
  1.0 * sum(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(clicks + views + COALESCE(competing_views,0)), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CostPerVisit",
  avg(sum(view_viewed)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewableImpressions",
  1.0 * sum(sum(view_viewed)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewableImpressionRate",
  avg(sum(clicks)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "clicks",
  1.0 * sum(sum(clicks)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ClickRate",
  avg(sum(click_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "click_conversions",
  1.0 * sum(sum(click_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ClickConversionRate",
  avg(sum(views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "views",
  1.0 * sum(sum(views + COALESCE(competing_views,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewRate",
  avg(sum(view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewConversions",
  1.0 * sum(sum(view_conversions + COALESCE(competing_view_conversions,0))) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewConversionRate",
  1.0 * sum(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(clicks), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) "CostPerClick",
  1.0 * sum(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / sum(NULLIF(sum(views + COALESCE(competing_views,0)), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CostPerView"
from
  sum_by_parent_campaign_group_by_day s
  join campaign_groups c using (campaign_group_id)
where 1=1
  -- and day >= '2024-04-01' and  day < current_date 
   and day >= current_date - interval '21 day' 
  -- and c.objective_id in ($obj_id )     
   and s.advertiser_id not in (34411, 32771, 36202)
  -- and $__timeFilter(s.day)
group by
  s.day
order by
  s.day

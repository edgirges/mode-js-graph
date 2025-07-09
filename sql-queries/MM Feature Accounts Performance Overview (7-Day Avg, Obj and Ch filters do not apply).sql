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
  day::DATE as "day",  --$__timeGroupAlias(day, '1d'),
  avg(sum(display_impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "MultiTouchImpressions",
  avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Impressions",
  avg(sum(clicks + views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Visits",
  avg(sum(uniques)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UsersReached",
  avg(sum(media_spend + data_spend + platform_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Total_Spend",
  1.0 * avg(sum(clicks + views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  as "ImpressionVisitRate",
  1.0 * avg(sum(clicks + views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UserVisitRate",
  1.0 * avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Frequency",
  avg(sum(click_conversions + view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Conversions",
  1.0 * avg(sum(click_conversions + view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UserConversionRate",
  1.0 * avg(sum(click_conversions + view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ImpressionConversionRate",
  1.0 * avg(sum(click_conversions + view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(clicks + views), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ConversionRate",
  avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "spend",
  1.0 * avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(click_conversions + view_conversions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CPA",
  avg(sum(existing_site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ExistingSiteVisitors",
  avg(sum(new_site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "NewSiteVisitors",
  avg(sum(click_order_value + view_order_value)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "OrderValue",
  1.0 * avg(sum(click_order_value + view_order_value)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ROAS",
  1.0 * avg(sum(click_order_value + view_order_value) - sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ROI",
  avg(sum(site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "SiteVisitors",
  avg(sum(new_users_reached)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "NewUsersReached",
  avg(sum(existing_users_reached)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ExistingUsersReached",
  avg(sum(video_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "TVSpend",
  1.0 * avg(sum(media_spend + data_spend + platform_spend  + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) 
    / (avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) / 1000.0) as "SpendCPM",
  1.0 * avg(sum(media_cost)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) 
    / (avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) / 1000.0) as "CostCPM",  
  1.0 * avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(clicks + views), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CostPerVisit",
  avg(sum(view_viewed)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewableImpressions",
  1.0 * avg(sum(view_viewed)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewableImpressionRate",
  avg(sum(clicks)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "clicks",
  1.0 * avg(sum(clicks)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ClickRate",
  avg(sum(click_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "click_conversions",
  1.0 * avg(sum(click_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ClickConversionRate",
  avg(sum(views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "views",
  100.0 * avg(sum(views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewRate",
  avg(sum(view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewConversions",
  1.0 * avg(sum(view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewConversionRate",
  1.0 * avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(clicks), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) "CostPerClick",
  1.0 * avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(views), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CostPerView"
from
  sum_by_campaign_group_by_day s
  join campaign_groups cg using (campaign_group_id)
where 1=1 
   and day >= '2024-01-01' 
   and s.advertiser_id != 34411
   and coalesce(cg.parent_campaign_group_id, cg.campaign_group_id) in
      (
        select
              coalesce(cg.parent_campaign_group_id, cg.campaign_group_id) as cgid
          from bi.v_campaign_feature_date f
                   join campaign_groups cg on (f.campaign_group_id = cg.campaign_group_id)
          where
            (end_date >= current_date or end_date is null)
            and cg.is_test is false
            and cg.campaign_group_status = 'LIVE'
      )
  -- and $__timeFilter(s.day)
group by
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
  day::DATE as "day",  --$__timeGroupAlias(day, '1d'),
  avg(sum(display_impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "MultiTouchImpressions",
  avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Impressions",
  avg(sum(clicks + views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Visits",
  avg(sum(uniques)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UsersReached",
  avg(sum(media_spend + data_spend + platform_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Total_Spend",
  1.0 * avg(sum(clicks + views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  as "ImpressionVisitRate",
  1.0 * avg(sum(clicks + views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UserVisitRate",
  1.0 * avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Frequency",
  avg(sum(click_conversions + view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "Conversions",
  1.0 * avg(sum(click_conversions + view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(uniques), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "UserConversionRate",
  1.0 * avg(sum(click_conversions + view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ImpressionConversionRate",
  1.0 * avg(sum(click_conversions + view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(clicks + views), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ConversionRate",
  avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "spend",
  1.0 * avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(click_conversions + view_conversions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CPA",
  avg(sum(existing_site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ExistingSiteVisitors",
  avg(sum(new_site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "NewSiteVisitors",
  avg(sum(click_order_value + view_order_value)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "OrderValue",
  1.0 * avg(sum(click_order_value + view_order_value)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ROAS",
  1.0 * avg(sum(click_order_value + view_order_value) - sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ROI",
  avg(sum(site_visitors)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "SiteVisitors",
  avg(sum(new_users_reached)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "NewUsersReached",
  avg(sum(existing_users_reached)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ExistingUsersReached",
  avg(sum(video_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "TVSpend",
  1.0 * avg(sum(media_spend + data_spend + platform_spend  + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) 
    / (avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) / 1000.0) as "SpendCPM",
  1.0 * avg(sum(media_cost)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) 
    / (avg(sum(impressions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) / 1000.0) as "CostCPM",  
  1.0 * avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(clicks + views), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CostPerVisit",
  avg(sum(view_viewed)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewableImpressions",
  1.0 * avg(sum(view_viewed)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewableImpressionRate",
  avg(sum(clicks)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "clicks",
  1.0 * avg(sum(clicks)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ClickRate",
  avg(sum(click_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "click_conversions",
  1.0 * avg(sum(click_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ClickConversionRate",
  avg(sum(views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "views",
  100.0 * avg(sum(views)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewRate",
  avg(sum(view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewConversions",
  1.0 * avg(sum(view_conversions)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(impressions), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "ViewConversionRate",
  1.0 * avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(clicks), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) "CostPerClick",
  1.0 * avg(sum(media_spend + data_spend + platform_spend + legacy_spend)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
    / avg(NULLIF(sum(views), 0)) over (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as "CostPerView"
from
  sum_by_campaign_group_by_day s
  join campaign_groups cg using (campaign_group_id)
where 1=1 
   and day >= '2024-01-01' 
   and s.advertiser_id != 34411
   and coalesce(cg.parent_campaign_group_id, cg.campaign_group_id) in
      (
        select
              coalesce(cg.parent_campaign_group_id, cg.campaign_group_id) as cgid
          from bi.v_campaign_feature_date f
                   join campaign_groups cg on (f.campaign_group_id = cg.campaign_group_id)
          where
            (end_date >= current_date or end_date is null)
            and cg.is_test is false
            and cg.campaign_group_status = 'LIVE'
      )
  -- and $__timeFilter(s.day)
group by
  s.day

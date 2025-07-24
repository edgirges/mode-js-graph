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
    extract(day from s.day - cg.start_time) as progressing_day,
    sum(impressions) as impressions,
    sum(media_spend + data_spend + platform_spend) as total_spend,
    sum(clicks + views) as visits,
    sum(click_conversions + view_conversions) as conversions,
    sum(click_order_value + view_order_value) as order_values,
    1.0 * sum(clicks + views) / NULLIF(sum(uniques), 0) as uvr,
    1.0 * sum(click_conversions + view_conversions) / nullif(sum(clicks + views),0) as cvr,
    1.0 * sum(click_order_value + view_order_value) /
        NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend), 0) as ROAS,
    1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) /
        NULLIF(sum(click_conversions + view_conversions), 0) as CPA,
    1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) /
        NULLIF(sum(clicks + views), 0) as CPV
from
    sum_by_parent_campaign_group_by_day s
        join campaign_groups cg using (campaign_group_id)
where 1=1
    -- and s.day >= '2024-05-01' and s.day < '2025-01-01'
    -- and extract(day from s.day - cg.start_time) <= 180
    -- and cg.start_time > '2024-05-01'
    -- and cg.end_time > current_date
    and s.day >= current_date - interval '21 day'
    and extract(day from s.day - cg.start_time) <= 180
    and cg.start_time >= '2024-05-01'
    and cg.end_time > current_date
    and cg.advertiser_id != 34411 -- exclude Uber Eats
    --and cg.campaign_group_status = 'LIVE'
group by
    1 --, s.day, cg.start_time
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
    extract(day from s.day - cg.start_time) as progressing_day,
    sum(impressions) as impressions,
    sum(media_spend + data_spend + platform_spend) as total_spend,
    sum(clicks + views) as visits,
    sum(click_conversions + view_conversions) as conversions,
    sum(click_order_value + view_order_value) as order_values,
    1.0 * sum(clicks + views) / NULLIF(sum(uniques), 0) as uvr,
    1.0 * sum(click_conversions + view_conversions) / nullif(sum(clicks + views),0) as cvr,
    1.0 * sum(click_order_value + view_order_value) /
        NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend), 0) as ROAS,
    1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) /
        NULLIF(sum(click_conversions + view_conversions), 0) as CPA,
    1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) /
        NULLIF(sum(clicks + views), 0) as CPV
from
    sum_by_parent_campaign_group_by_day s
        join campaign_groups cg using (campaign_group_id)
where 1=1
    -- and s.day >= '2024-05-01' and s.day < '2025-01-01'
    -- and extract(day from s.day - cg.start_time) <= 180
    -- and cg.start_time > '2024-05-01'
    -- and cg.end_time > current_date
    and s.day >= current_date - interval '21 day'
    and extract(day from s.day - cg.start_time) <= 180
    and cg.start_time >= '2024-05-01'
    and cg.end_time > current_date
    and cg.advertiser_id != 34411 -- exclude Uber Eats
    --and cg.campaign_group_status = 'LIVE'
group by
    1 --, s.day, cg.start_time

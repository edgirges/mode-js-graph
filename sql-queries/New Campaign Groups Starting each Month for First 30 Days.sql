/*
* Notes:
* -
* -
* -
*
* Questions:
* - Should we make the query dynamic to start at the year for the year we are in, or use a rolling basis?
   --> current_date - interval '6 month'
* - 
* - 
*/


--- new CGs progressing by day
with month_list as
    (
        select
            to_char(start_time, 'YYYY-MM') as month,
            count( distinct coalesce(campaign_group_id, parent_campaign_group_id) ) as cg_cnt
        from campaign_groups
        where
            start_time >= current_date - interval '6 month' -- '2024-01-01' --and start_time <= '2024-09-30'
        group by 1
    ),
metrics_data as
    (select to_char(cg.start_time, 'YYYY-MM')                                                as month,
            sum(impressions)                                                                 as impressions,
            sum(media_spend + data_spend + platform_spend)                                   as total_spend,
            sum(clicks + views)                                                              as visits,
            sum(click_conversions + view_conversions)                                        as conversions,
            sum(click_order_value + view_order_value)                                        as order_values,
            1.0 * sum(clicks + views) / NULLIF(sum(uniques), 0)                              as uvr,
            1.0 * sum(click_conversions + view_conversions) / nullif(sum(clicks + views), 0) as cvr,
            1.0 * sum(click_order_value + view_order_value) /
                NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend), 0)         as ROAS,
            1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) /
                NULLIF(sum(click_conversions + view_conversions), 0)                             as CPA,
            1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) /
                NULLIF(sum(clicks + views), 0)                                                   as CPV
     from sum_by_parent_campaign_group_by_day s
              join campaign_groups cg using (campaign_group_id)
     where s.day >= '2024-01-01'
       and s.day < current_date
       and extract(day from s.day - cg.start_time) <= 30
       and extract(day from s.day - cg.start_time) >= 0
       and cg.start_time >= '2024-01-01'
       and cg.start_time <= current_date
       --and cg.advertiser_id != 34411 -- exclude Uber Eats
     group by 1
     order by 1)
select
    ml.cg_cnt, md.*,
    1.0 * impressions / cg_cnt as imps_per_cg,
    1.0 * total_spend / cg_cnt as spend_per_cg,
    1.0 * visits / cg_cnt as visits_per_cg,
    1.0 * conversions / cg_cnt as convs_per_cg,
    1.0 * order_values / cg_cnt as order_values_per_cg
from
    month_list ml join metrics_data md using (month)
order by ml.month
/*
* Notes:
* -
* -
* -
*
* Questions:
* - Should we make the query dynamic to start at the year for the year we are in, or use a rolling basis?
   --> current_date - interval '6 month'
* - 
* - 
*/


--- new CGs progressing by day
with month_list as
    (
        select
            to_char(start_time, 'YYYY-MM') as month,
            count( distinct coalesce(campaign_group_id, parent_campaign_group_id) ) as cg_cnt
        from campaign_groups
        where
            start_time >= current_date - interval '6 month' -- '2024-01-01' --and start_time <= '2024-09-30'
        group by 1
    ),
metrics_data as
    (select to_char(cg.start_time, 'YYYY-MM')                                                as month,
            sum(impressions)                                                                 as impressions,
            sum(media_spend + data_spend + platform_spend)                                   as total_spend,
            sum(clicks + views)                                                              as visits,
            sum(click_conversions + view_conversions)                                        as conversions,
            sum(click_order_value + view_order_value)                                        as order_values,
            1.0 * sum(clicks + views) / NULLIF(sum(uniques), 0)                              as uvr,
            1.0 * sum(click_conversions + view_conversions) / nullif(sum(clicks + views), 0) as cvr,
            1.0 * sum(click_order_value + view_order_value) /
                NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend), 0)         as ROAS,
            1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) /
                NULLIF(sum(click_conversions + view_conversions), 0)                             as CPA,
            1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) /
                NULLIF(sum(clicks + views), 0)                                                   as CPV
     from sum_by_parent_campaign_group_by_day s
              join campaign_groups cg using (campaign_group_id)
     where s.day >= '2024-01-01'
       and s.day < current_date
       and extract(day from s.day - cg.start_time) <= 30
       and extract(day from s.day - cg.start_time) >= 0
       and cg.start_time >= '2024-01-01'
       and cg.start_time <= current_date
       --and cg.advertiser_id != 34411 -- exclude Uber Eats
     group by 1
     order by 1)
select
    ml.cg_cnt, md.*,
    1.0 * impressions / cg_cnt as imps_per_cg,
    1.0 * total_spend / cg_cnt as spend_per_cg,
    1.0 * visits / cg_cnt as visits_per_cg,
    1.0 * conversions / cg_cnt as convs_per_cg,
    1.0 * order_values / cg_cnt as order_values_per_cg
from
    month_list ml join metrics_data md using (month)
order by ml.month

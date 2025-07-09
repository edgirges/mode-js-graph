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


with 
    cohort as 
    (
        select
            hour::date as day,
            h.campaign_group_id,
            sum(cohort_first_day_visits + cohort_competing_first_day_views) as day0_visits
        from
            summarydata.cohort_visit_facts h
        where 1=1
            -- and $__timeFilter(hour::date)
            and hour >= current_date - interval '21 day'
        group by 
            1,2
    ),

    base as
    (
        select
            day
            ,campaign_group_id
            ,sum(impressions) as imps
            ,sum(uniques) as uni
            ,sum(impressions) * 1.0 / nullif(sum(uniques),0) as freq
            ,round(sum(click_conversions + view_conversions) * 1.0 / nullif(sum(clicks+views),0),4) as cvr
            ,round(sum(clicks + views) * 1.0 / nullif(sum(impressions),0),4) as ivr
            --,round(sum(clicks + views) * 1.0 / nullif(sum(uniques),0),4) as uvr
            ,round(sum(media_spend + data_spend + platform_spend + legacy_spend) * 1.0 / NULLIF(sum(click_conversions + view_conversions), 0),4) as cpa
            ,round(sum(media_spend + data_spend + platform_spend + legacy_spend) * 1.0 / NULLIF(sum(clicks + views), 0),4) as cpv
            ,round(sum(click_order_value + view_order_value) * 1.0 / NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0),8) as roas
            ,round(1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) / (NULLIF(sum(impressions), 0) / 1000.0), 2) as spend_cpm
            ,round(1.0 * sum(media_spend) / (NULLIF(sum(impressions), 0) / 1000.0), 2) as "cost_cpm"
            ,round(sum(day0_visits) * 1.0 / nullif(sum(impressions),0),4) as day0_ivr
        from
            sum_by_parent_campaign_group_by_day s
                left join cohort h using (day, campaign_group_id)
                join campaign_groups cg using (campaign_group_id)
        where 1=1
            -- and $__timeFilter(day)
            and day >= current_date - interval '21 day'
            -- and cg.objective_id in ($obj_id) 
        group by 1,2
    )
    
select
    base.day,
    percentile_cont(0.25) within group (order by imps) filter (where imps is not null) as imp_pct_25,
    percentile_cont(0.5) within group (order by imps) filter (where imps is not null) as imp_pct_50,
    percentile_cont(0.75) within group (order by imps) filter (where imps is not null) as imp_pct_75,

    percentile_cont(0.25) within group (order by day0_ivr) filter (where day0_ivr is not null) as day0_ivr_pct_25,
    percentile_cont(0.5) within group (order by day0_ivr) filter (where day0_ivr is not null) as day0_ivr_pct_50,
    percentile_cont(0.75) within group (order by day0_ivr) filter (where day0_ivr is not null) as day0_ivr_pct_75,

    percentile_cont(0.25) within group (order by uni) filter (where uni is not null) as uni_pct_25,
    percentile_cont(0.5) within group (order by uni) filter (where uni is not null) as uni_pct_50,
    percentile_cont(0.75) within group (order by uni) filter (where uni is not null) as uni_pct_75,
    percentile_cont(0.25) within group (order by freq) filter (where freq is not null) as freq_pct_25,
    percentile_cont(0.5) within group (order by freq) filter (where freq is not null) as freq_pct_50,
    percentile_cont(0.75) within group (order by freq) filter (where freq is not null) as freq_pct_75,
    percentile_cont(0.25) within group (order by ivr) filter (where ivr is not null) as ivr_pct_25,
    percentile_cont(0.5) within group (order by ivr) filter (where ivr is not null) as ivr_pct_50,
    percentile_cont(0.75) within group (order by ivr) filter (where ivr is not null) as ivr_pct_75,
    percentile_cont(0.25) within group (order by cvr) filter (where cpv is not null) as cvr_pct_25,
    percentile_cont(0.5) within group (order by cvr) filter (where cpv is not null) as cvr_pct_50,
    percentile_cont(0.75) within group (order by cvr) filter (where cpv is not null) as cvr_pct_75,
    percentile_cont(0.25) within group (order by cpa) filter (where cpa is not null) as cpa_pct_25,
    percentile_cont(0.5) within group (order by cpa) filter (where cpa is not null) as cpa_pct_50,
    percentile_cont(0.75) within group (order by cpa) filter (where cpa is not null) as cpa_pct_75,
    percentile_cont(0.25) within group (order by cpv) filter (where cpv is not null) as cpv_pct_25,
    percentile_cont(0.5) within group (order by cpv) filter (where cpv is not null) as cpv_pct_50,
    percentile_cont(0.75) within group (order by cpv) filter (where cpv is not null) as cpv_pct_75,
    percentile_cont(0.25) within group (order by roas) filter (where roas is not null) as roas_pct_25,
    percentile_cont(0.5) within group (order by roas) filter (where roas is not null) as roas_pct_50,
    percentile_cont(0.75) within group (order by roas) filter (where roas is not null) as roas_pct_75,
    percentile_cont(0.25) within group (order by spend_cpm) filter (where spend_cpm is not null) as spend_cpm_pct_25,
    percentile_cont(0.5) within group (order by spend_cpm) filter (where spend_cpm is not null) as spend_cpm_pct_50,
    percentile_cont(0.75) within group (order by spend_cpm) filter (where spend_cpm is not null) as spend_cpm_pct_75,
    percentile_cont(0.25) within group (order by cost_cpm) filter (where cost_cpm is not null) as cost_cpm_pct_25,
    percentile_cont(0.5) within group (order by cost_cpm) filter (where cost_cpm is not null) as cost_cpm_pct_50,
    percentile_cont(0.75) within group (order by cost_cpm) filter (where cost_cpm is not null) as cost_cpm_pct_75
from
    base 
where
    1=1
group by 1
-- order by 1
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


with 
    cohort as 
    (
        select
            hour::date as day,
            h.campaign_group_id,
            sum(cohort_first_day_visits + cohort_competing_first_day_views) as day0_visits
        from
            summarydata.cohort_visit_facts h
        where 1=1
            -- and $__timeFilter(hour::date)
            and hour >= current_date - interval '21 day'
        group by 
            1,2
    ),

    base as
    (
        select
            day
            ,campaign_group_id
            ,sum(impressions) as imps
            ,sum(uniques) as uni
            ,sum(impressions) * 1.0 / nullif(sum(uniques),0) as freq
            ,round(sum(click_conversions + view_conversions) * 1.0 / nullif(sum(clicks+views),0),4) as cvr
            ,round(sum(clicks + views) * 1.0 / nullif(sum(impressions),0),4) as ivr
            --,round(sum(clicks + views) * 1.0 / nullif(sum(uniques),0),4) as uvr
            ,round(sum(media_spend + data_spend + platform_spend + legacy_spend) * 1.0 / NULLIF(sum(click_conversions + view_conversions), 0),4) as cpa
            ,round(sum(media_spend + data_spend + platform_spend + legacy_spend) * 1.0 / NULLIF(sum(clicks + views), 0),4) as cpv
            ,round(sum(click_order_value + view_order_value) * 1.0 / NULLIF(sum(media_spend + data_spend + platform_spend + legacy_spend),0),8) as roas
            ,round(1.0 * sum(media_spend + data_spend + platform_spend + legacy_spend) / (NULLIF(sum(impressions), 0) / 1000.0), 2) as spend_cpm
            ,round(1.0 * sum(media_spend) / (NULLIF(sum(impressions), 0) / 1000.0), 2) as "cost_cpm"
            ,round(sum(day0_visits) * 1.0 / nullif(sum(impressions),0),4) as day0_ivr
        from
            sum_by_parent_campaign_group_by_day s
                left join cohort h using (day, campaign_group_id)
                join campaign_groups cg using (campaign_group_id)
        where 1=1
            -- and $__timeFilter(day)
            and day >= current_date - interval '21 day'
            -- and cg.objective_id in ($obj_id) 
        group by 1,2
    )
    
select
    base.day,
    percentile_cont(0.25) within group (order by imps) filter (where imps is not null) as imp_pct_25,
    percentile_cont(0.5) within group (order by imps) filter (where imps is not null) as imp_pct_50,
    percentile_cont(0.75) within group (order by imps) filter (where imps is not null) as imp_pct_75,

    percentile_cont(0.25) within group (order by day0_ivr) filter (where day0_ivr is not null) as day0_ivr_pct_25,
    percentile_cont(0.5) within group (order by day0_ivr) filter (where day0_ivr is not null) as day0_ivr_pct_50,
    percentile_cont(0.75) within group (order by day0_ivr) filter (where day0_ivr is not null) as day0_ivr_pct_75,

    percentile_cont(0.25) within group (order by uni) filter (where uni is not null) as uni_pct_25,
    percentile_cont(0.5) within group (order by uni) filter (where uni is not null) as uni_pct_50,
    percentile_cont(0.75) within group (order by uni) filter (where uni is not null) as uni_pct_75,
    percentile_cont(0.25) within group (order by freq) filter (where freq is not null) as freq_pct_25,
    percentile_cont(0.5) within group (order by freq) filter (where freq is not null) as freq_pct_50,
    percentile_cont(0.75) within group (order by freq) filter (where freq is not null) as freq_pct_75,
    percentile_cont(0.25) within group (order by ivr) filter (where ivr is not null) as ivr_pct_25,
    percentile_cont(0.5) within group (order by ivr) filter (where ivr is not null) as ivr_pct_50,
    percentile_cont(0.75) within group (order by ivr) filter (where ivr is not null) as ivr_pct_75,
    percentile_cont(0.25) within group (order by cvr) filter (where cpv is not null) as cvr_pct_25,
    percentile_cont(0.5) within group (order by cvr) filter (where cpv is not null) as cvr_pct_50,
    percentile_cont(0.75) within group (order by cvr) filter (where cpv is not null) as cvr_pct_75,
    percentile_cont(0.25) within group (order by cpa) filter (where cpa is not null) as cpa_pct_25,
    percentile_cont(0.5) within group (order by cpa) filter (where cpa is not null) as cpa_pct_50,
    percentile_cont(0.75) within group (order by cpa) filter (where cpa is not null) as cpa_pct_75,
    percentile_cont(0.25) within group (order by cpv) filter (where cpv is not null) as cpv_pct_25,
    percentile_cont(0.5) within group (order by cpv) filter (where cpv is not null) as cpv_pct_50,
    percentile_cont(0.75) within group (order by cpv) filter (where cpv is not null) as cpv_pct_75,
    percentile_cont(0.25) within group (order by roas) filter (where roas is not null) as roas_pct_25,
    percentile_cont(0.5) within group (order by roas) filter (where roas is not null) as roas_pct_50,
    percentile_cont(0.75) within group (order by roas) filter (where roas is not null) as roas_pct_75,
    percentile_cont(0.25) within group (order by spend_cpm) filter (where spend_cpm is not null) as spend_cpm_pct_25,
    percentile_cont(0.5) within group (order by spend_cpm) filter (where spend_cpm is not null) as spend_cpm_pct_50,
    percentile_cont(0.75) within group (order by spend_cpm) filter (where spend_cpm is not null) as spend_cpm_pct_75,
    percentile_cont(0.25) within group (order by cost_cpm) filter (where cost_cpm is not null) as cost_cpm_pct_25,
    percentile_cont(0.5) within group (order by cost_cpm) filter (where cost_cpm is not null) as cost_cpm_pct_50,
    percentile_cont(0.75) within group (order by cost_cpm) filter (where cost_cpm is not null) as cost_cpm_pct_75
from
    base 
where
    1=1
group by 1
-- order by 1

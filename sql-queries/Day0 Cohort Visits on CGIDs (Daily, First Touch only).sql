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
cohort_visits_ct_new as (
    select
        hour::date as cohort_date,
        sum(cohort_first_day_visits + cohort_competing_first_day_views)  as day_0_visits
    from
        summarydata.cohort_visit_facts
            join campaigns c using (campaign_id)
    where 1=1 
        -- and c.objective_id in ($obj_id)
        -- and c.channel_id in ($channel_id)
        -- and $__timeFilter(hour::date)
        -- and hour::date <= current_date
        and hour::date >= current_date - interval '7 day'
    group by 
        1
)

, cohort_conversions_ct_new as (
    select
        hour::date as cohort_date,
        sum(cohort_first_day_conversions + cohort_competing_first_day_conversions)  as day_0_conversions
    from
        summarydata.cohort_conversion_facts
            join campaigns c using (campaign_id)
    where 1=1
        -- and c.objective_id in ($obj_id)
        -- and c.channel_id in ($channel_id)
        -- and $__timeFilter(hour::date)
        -- and hour::date <= current_date
        and hour::date >= current_date - interval '7 day'
    group by 
        1
)
, imps_ct as (
    select day as cohort_date
        , sum(impressions) as impressions
    from sum_by_campaign_by_day
        join campaigns using (campaign_id)
    where 1=1
        -- and objective_id in ($obj_id)
        -- and channel_id in ($channel_id)
        -- and $__timeFilter(day)
        -- and day <= current_date
        and day >= current_date - interval '7 day'
    group by 1
)

select *, 
    day_0_visits * 1.0 / nullif(impressions, 0) as day_0_ivr,
    day_0_conversions * 1.0 / nullif(day_0_visits, 0) as day_0_cvr
from imps_ct
    left join cohort_visits_ct_new using (cohort_date)
    left join cohort_conversions_ct_new using (cohort_date)
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


with base as
    (select
        day,
        advertiser_id,
        sum(raw_visits) as "raw_visits",
        sum(raw_conversions) as "raw_conversions",
        sum(raw_order_value) as "raw_order_values"
    from
        sum_by_advertiser_by_day
    where 1=1
        -- and day >= '2024-09-01'
        and day >= current_date - interval '21 day'
    group by
        1,2)
select
    day,
    percentile_cont(0.25) within group (order by raw_visits) filter (where raw_visits is not null) as raw_visits_pct_25,
    percentile_cont(0.5) within group (order by raw_visits) filter (where raw_visits is not null) as raw_visits_pct_50,
    percentile_cont(0.75) within group (order by raw_visits) filter (where raw_visits is not null) as raw_visits_pct_75,
    percentile_cont(0.25) within group (order by raw_conversions) filter (where raw_conversions is not null) as raw_convs_pct_25,
    percentile_cont(0.5) within group (order by raw_conversions) filter (where raw_conversions is not null) as raw_convs_pct_50,
    percentile_cont(0.75) within group (order by raw_conversions) filter (where raw_conversions is not null) as raw_convs_pct_75,
    percentile_cont(0.25) within group (order by raw_order_values) filter (where raw_order_values is not null) as raw_order_values_pct_25,
    percentile_cont(0.5) within group (order by raw_order_values) filter (where raw_order_values is not null) as raw_order_values_pct_50,
    percentile_cont(0.75) within group (order by raw_order_values) filter (where raw_order_values is not null) as raw_order_values_pct_75
from base
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


with base as
    (select
        day,
        advertiser_id,
        sum(raw_visits) as "raw_visits",
        sum(raw_conversions) as "raw_conversions",
        sum(raw_order_value) as "raw_order_values"
    from
        sum_by_advertiser_by_day
    where 1=1
        -- and day >= '2024-09-01'
        and day >= current_date - interval '21 day'
    group by
        1,2)
select
    day,
    percentile_cont(0.25) within group (order by raw_visits) filter (where raw_visits is not null) as raw_visits_pct_25,
    percentile_cont(0.5) within group (order by raw_visits) filter (where raw_visits is not null) as raw_visits_pct_50,
    percentile_cont(0.75) within group (order by raw_visits) filter (where raw_visits is not null) as raw_visits_pct_75,
    percentile_cont(0.25) within group (order by raw_conversions) filter (where raw_conversions is not null) as raw_convs_pct_25,
    percentile_cont(0.5) within group (order by raw_conversions) filter (where raw_conversions is not null) as raw_convs_pct_50,
    percentile_cont(0.75) within group (order by raw_conversions) filter (where raw_conversions is not null) as raw_convs_pct_75,
    percentile_cont(0.25) within group (order by raw_order_values) filter (where raw_order_values is not null) as raw_order_values_pct_25,
    percentile_cont(0.5) within group (order by raw_order_values) filter (where raw_order_values is not null) as raw_order_values_pct_50,
    percentile_cont(0.75) within group (order by raw_order_values) filter (where raw_order_values is not null) as raw_order_values_pct_75
from base
group by 1
-- order by 1

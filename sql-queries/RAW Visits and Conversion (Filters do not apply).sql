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
    day
    ,sum(raw_visits) as "Raw Visits"
    ,sum(raw_conversions) as "Raw Conversions"
    ,sum(raw_order_value) as "Raw Order Values"
from 
    sum_by_advertiser_by_day 
where 1=1
    -- and day >= '2023-01-01'
    and day >= current_date - interval '21 day'
group by 
    1
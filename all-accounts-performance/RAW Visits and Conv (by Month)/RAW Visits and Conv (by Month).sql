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
    to_char(day, 'YYYY-MM') as month
    ,sum(raw_visits) as "Raw Visits"
    ,sum(raw_conversions) as "Raw Conversions"
    ,sum(raw_order_value) as "Raw Order Values"
from 
    sum_by_advertiser_by_day 
where 
    day >= current_date - interval '24 month' -- '2023-01-01'
group by 
    1
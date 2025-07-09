/*
* Notes:
* - Mode has a feature where we can save this query as a dataset, which we can then reference
*   - This can run in the background once a day, and then the report can ref the data set and apply filters on top of that
*   - To-do: Look up dataset feature
* - Look up styling from Ed's guides; there are other mode reports to reference (total histogram endpoints)
*
* Questions:
* - 
* -
* -
*/


-- heavy query, takes >1 m even for a 7-day window

select 
  date(time), 
  count(1) total_impressions, 
  count(1) filter (where unlinked) as unlinked_impressions,
  count(1) filter (where unlinked) * 1.0 / count(1) as unlinked_imp_pct
from 
  cost_impression_log 
where 1=1
  and time >= current_date - interval '7 day' 
group by 1 
;
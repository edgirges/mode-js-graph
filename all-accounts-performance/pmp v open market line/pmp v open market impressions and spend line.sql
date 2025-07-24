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


-- Heavy query, but expected

select 
      --to_char(time, 'YYYY-MM-DD') as day,
       time::date as day,
       count(1) as imps_total,
       count(1) filter (where deal_id != 'N/A') as imps_pmp,
       count(1) filter (where deal_id = 'N/A') as imps_open_market,
       count(1) filter (where placement_type = 'VIDEO' and deal_id != 'N/A') as imps_video_pmp,
       count(1) filter (where placement_type = 'VIDEO' and deal_id = 'N/A') as imps_video_open_market,
       count(1) filter (where placement_type = 'BANNER' and deal_id != 'N/A') as imps_banner_pmp,
       count(1) filter (where placement_type = 'BANNER' and deal_id = 'N/A') as imps_banner_open_market
from win_logs
where 
  time >= current_date - interval '7 day'
group by 1
;
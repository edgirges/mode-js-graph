/*
* Notes:
* -
* -
* -
*
* Questions:
* - What's the distinction btwn campaign_group_id and parent_campaign_group_id?
    --> 
* -
* -
*/


with visit_data as
         (select date(v.time)
               , count(1)                                                 as visits
               , count(1) filter (where from_verified_impression = false and click = false) as nonpaid_views
               , count(1) filter (where from_verified_impression = false and click = true) as nonpaid_clicks
               , count(1) filter (where from_verified_impression = false) as nonpaid_visits
               , count(1) filter (where v.advertiser_id = 9090)             as psa_visits
               , count(distinct v.advertiser_id)                          as advertiser_cnt
               , count(distinct pcg.campaign_group_id)                    as cg_cnt
          from summarydata.visits v
                   join public.campaigns c on c.campaign_id = v.campaign_id
                   join public.campaign_groups cg on cg.campaign_group_id = c.campaign_group_id
                   join public.campaign_groups pcg
                        on pcg.campaign_group_id = coalesce(cg.parent_campaign_group_id, cg.campaign_group_id)
                   join public.advertisers a on a.advertiser_id = v.advertiser_id
          where 1=1
            --and v.time >= '2024-01-01' and v.time < current_date 
            --and $__timeFilter(v.time) and v.time < current_date
            and v.time >= current_date - interval '7 day' 
            and a.is_test is false
            and pcg.is_test is false
            -- and c.channel_id in ($channel_id )
            -- and c.objective_id in ($obj_id)
          group by 1
          )
select
     *
     , nonpaid_visits::Decimal / visits::Decimal * 1.0 as nonpaid_visits_pct
     , psa_visits::Decimal / visits::Decimal * 1.0 as psa_visits_pct
from visit_data
;
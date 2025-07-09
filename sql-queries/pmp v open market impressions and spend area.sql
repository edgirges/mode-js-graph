/*
* Notes:
* -
* -
* -
*
* Questions:
* - Curious mostly around naming convention for the pmp id
* -
* -
*/


with ttl as
    (
        select
            day,
            sum(impressions) total_imps,
            sum(impressions)
                filter (where private_marketplace_id like '-%' or private_marketplace_id like 'LM%') as open_imps,
            sum(media_spend + data_spend + platform_spend) total_spend,
            sum(media_spend + data_spend + platform_spend)
                filter (where private_marketplace_id like '-%' or private_marketplace_id like 'LM%') as open_spend
        from sum_by_private_marketplace_by_day s
        join private_marketplace_deals p on p.partner_deal_id = s.private_marketplace_id
        where 1=1
            and day >= current_date - interval '7 day'
            -- and day >= '2024-01-01' and day < current_date
            -- and p.channel_id in ($channel_id) 
            -- and $__timeFilter(day)
        group by 1
    )
select
    day,
    total_spend / total_imps * 1000.0 as blended_cpm,
    open_spend / open_imps * 1000.0 as open_cpm,
    (total_spend - open_spend) / (total_imps - open_imps) * 1000.0 as pmp_cpm,

    open_imps,
    (total_imps - open_imps) as pmp_imps,

    1.0 * open_imps/total_imps as open_imps_pct,
    1.0 * (total_imps - open_imps)/total_imps as pmp_imps_pct,

    open_spend,
    (total_spend - open_spend) as pmp_spend,
    1.0 * open_spend/total_spend as open_spend_pct,
    1.0 * (total_spend - open_spend)/total_spend as pmp_spend_pct

from ttl
;
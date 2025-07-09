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


WITH campaign_summary AS (
    select
        date(run_time) as day
        , (dimension->'campaign_id')::text             as campaign_id
        , (metadata->'campaign_group_id')::text         as campaign_group_id
        , COALESCE((metadata->'wins_count')::text,'0')::integer             as wins_count
        , COALESCE((metadata->'matched_raw_pv_count')::text,'0')::integer   as pv_count
        , COALESCE((metadata->'matched_raw_conv_count')::text,'0')::integer as cv_count
    from ddm.audit_execution_results
    LEFT JOIN campaign_groups cg on cg.campaign_group_id::text = (metadata->'campaign_group_id')::text
    where audit_id = 10
    --and (metadata->'campaign_group_id')::text IN ('30932','62200','32267')
    --and (metadata->'campaign_group_id')::text IN ('32267')
    -- AND cg.objective_id in ($obj_id )
    -- ORDER BY run_time
)
SELECT
    day
    --, campaign_group_id
    , sum(wins_count)  as wins
    , sum(pv_count)    as pv_count
    , sum(cv_count)    as cv_count
    , ROUND(1.0 * sum(pv_count) / sum(wins_count),4) as pv_perc
    , ROUND(1.0 * sum(cv_count) / sum(wins_count),4) as cv_perc
FROM campaign_summary
GROUP BY 1
-- ORDER BY 1
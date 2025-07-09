/*
* Notes:
* -
* -
* -
*
* Questions:
* - we exclude campaigns that include DS 1,4,11,17,18,19,13,20,22 ?
* - 
* - 
*/


WITH version1_expression AS (
    SELECT campaign_id, jsonb_path_query(expression::jsonb, '$.interest.include[*].or[*]') AS parsed_interest
    FROM audience.audience_segments
    WHERE 1=1
    and expression_type_id = 2
)
, version2_expression AS (
    SELECT campaign_id, jsonb_path_query(expression::jsonb, '$.categories.where.value[*].value') AS item
    FROM audience.audience_segments
    WHERE 1=1 
    and expression_type_id = 2
    and expression like '%version%'
)
, audience_includes AS (
    SELECT
        campaign_id
    FROM version2_expression
    WHERE 1=1
    and (item->>'data_source_id')::int in (1,4,11,17,18,19,13,20,22)
    union
    SELECT
        campaign_id
    FROM version1_expression
    WHERE 1=1
    and (parsed_interest->>'data_source_id')::integer in (1,4,11,17,18,19,13,20,22)
)
SELECT
    date(time)
    , count(*) as total
    , count(*) filter (where recency_elapsed_time is not null) as impressions_with_recency
    , 1.0 * count(*) filter (where recency_elapsed_time is not null) / count(*) as percentage
FROM cost_impression_log cil
JOIN campaigns c on c.campaign_id = cil.campaign_id
LEFT JOIN audience_includes ai on ai.campaign_id = cil.campaign_id
LEFT JOIN segmentation_advertiser_time_window s on s.advertiser_id = cil.advertiser_id
WHERE 1=1
and ai.campaign_id is null
and c.objective_id = 4
-- and $__timeFilter(time)
and time >= current_date - interval '7 day'
and COALESCE(s.time_window, 30) <= 30
and unlinked = false
group by 1
/*
* Notes:
* -
* -
* -
*
* Questions:
* - we exclude campaigns that include DS 1,4,11,17,18,19,13,20,22 ?
* - 
* - 
*/


WITH version1_expression AS (
    SELECT campaign_id, jsonb_path_query(expression::jsonb, '$.interest.include[*].or[*]') AS parsed_interest
    FROM audience.audience_segments
    WHERE 1=1
    and expression_type_id = 2
)
, version2_expression AS (
    SELECT campaign_id, jsonb_path_query(expression::jsonb, '$.categories.where.value[*].value') AS item
    FROM audience.audience_segments
    WHERE 1=1 
    and expression_type_id = 2
    and expression like '%version%'
)
, audience_includes AS (
    SELECT
        campaign_id
    FROM version2_expression
    WHERE 1=1
    and (item->>'data_source_id')::int in (1,4,11,17,18,19,13,20,22)
    union
    SELECT
        campaign_id
    FROM version1_expression
    WHERE 1=1
    and (parsed_interest->>'data_source_id')::integer in (1,4,11,17,18,19,13,20,22)
)
SELECT
    date(time)
    , count(*) as total
    , count(*) filter (where recency_elapsed_time is not null) as impressions_with_recency
    , 1.0 * count(*) filter (where recency_elapsed_time is not null) / count(*) as percentage
FROM cost_impression_log cil
JOIN campaigns c on c.campaign_id = cil.campaign_id
LEFT JOIN audience_includes ai on ai.campaign_id = cil.campaign_id
LEFT JOIN segmentation_advertiser_time_window s on s.advertiser_id = cil.advertiser_id
WHERE 1=1
and ai.campaign_id is null
and c.objective_id = 4
-- and $__timeFilter(time)
and time >= current_date - interval '7 day'
and COALESCE(s.time_window, 30) <= 30
and unlinked = false
group by 1

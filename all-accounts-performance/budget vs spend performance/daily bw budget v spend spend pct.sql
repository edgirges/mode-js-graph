/*
* Notes:
* -  Think about using filters for objective_id and channel rather than parameters, bc parameters may need to 
* -
* -
*
* Questions:
* - When do we care about linked / unlinked impressions?
* - Default date filter : now - now() - 14d | Only last 35 days of data will be available at best
* -
*/


WITH dso_cgid_budget AS (
    SELECT DISTINCT ON (x_1.advertiser_id, x_1.campaign_group_id, date(x_1.update_time))
           x_1.advertiser_id, x_1.campaign_group_id, date(x_1.update_time) as day, x_1.budget
    FROM (
        SELECT campaign_group_daily_budgets.advertiser_id, campaign_group_daily_budgets.campaign_group_id
             , campaign_group_daily_budgets.budget, campaign_group_daily_budgets.update_time
        FROM dso.campaign_group_daily_budgets
        UNION ALL
        SELECT campaign_group_daily_budget_archives.advertiser_id
             , campaign_group_daily_budget_archives.campaign_group_id, campaign_group_daily_budget_archives.budget
             , campaign_group_daily_budget_archives.update_time
        FROM archives.campaign_group_daily_budget_archives
        ) x_1
    WHERE x_1.update_time >= current_date - interval '35 day'
), cgid_cost AS (
    SELECT
        date(cil.time at time zone 'UTC') as day,
        c_1.campaign_group_id,
        SUM(cil.media_cost) AS media_cost
    FROM cost_impression_log cil
        JOIN campaigns c_1 USING (campaign_id)
    WHERE
        cil.time >= current_date - interval '35 day'
        AND cil.unlinked IS FALSE
    GROUP BY 1,2
)
select
    cg.campaign_group_id ,
    to_char(b.day, 'YYYY-MM-DD') as day,
    round(sum(b.budget), 0) as budget,
    round(sum(c.media_cost), 0) as spend,
    round(sum(c.media_cost) / NULLIF(sum(b.budget),0), 3) as "spend pct"
from
    dso_cgid_budget b
        left join cgid_cost c on b.day = c.day and b.campaign_group_id = c.campaign_group_id
        join campaign_groups cg on b.campaign_group_id = cg.campaign_group_id
where 1=1
    -- and b.day >= current_date - interval '3 day' -- needs to be replaced with a date filter
    and b.day >= '1969-12-31'
    and b.day <= '2025-07-09'
    -- and cg.objective_id in ($obj_id) -- need to understand how objective is being used in the dashboard
group by
    1,2
order by
    1,2
/*
* Notes:
* -  Think about using filters for objective_id and channel rather than parameters, bc parameters may need to 
* -
* -
*
* Questions:
* - When do we care about linked / unlinked impressions?
* - Default date filter : now - now() - 14d | Only last 35 days of data will be available at best
* -
*/


WITH dso_cgid_budget AS (
    SELECT DISTINCT ON (x_1.advertiser_id, x_1.campaign_group_id, date(x_1.update_time))
           x_1.advertiser_id, x_1.campaign_group_id, date(x_1.update_time) as day, x_1.budget
    FROM (
        SELECT campaign_group_daily_budgets.advertiser_id, campaign_group_daily_budgets.campaign_group_id
             , campaign_group_daily_budgets.budget, campaign_group_daily_budgets.update_time
        FROM dso.campaign_group_daily_budgets
        UNION ALL
        SELECT campaign_group_daily_budget_archives.advertiser_id
             , campaign_group_daily_budget_archives.campaign_group_id, campaign_group_daily_budget_archives.budget
             , campaign_group_daily_budget_archives.update_time
        FROM archives.campaign_group_daily_budget_archives
        ) x_1
    WHERE x_1.update_time >= current_date - interval '35 day'
), cgid_cost AS (
    SELECT
        date(cil.time at time zone 'UTC') as day,
        c_1.campaign_group_id,
        SUM(cil.media_cost) AS media_cost
    FROM cost_impression_log cil
        JOIN campaigns c_1 USING (campaign_id)
    WHERE
        cil.time >= current_date - interval '35 day'
        AND cil.unlinked IS FALSE
    GROUP BY 1,2
)
select
    cg.campaign_group_id ,
    to_char(b.day, 'YYYY-MM-DD') as day,
    round(sum(b.budget), 0) as budget,
    round(sum(c.media_cost), 0) as spend,
    round(sum(c.media_cost) / NULLIF(sum(b.budget),0), 3) as "spend pct"
from
    dso_cgid_budget b
        left join cgid_cost c on b.day = c.day and b.campaign_group_id = c.campaign_group_id
        join campaign_groups cg on b.campaign_group_id = cg.campaign_group_id
where 1=1
    -- and b.day >= current_date - interval '3 day' -- needs to be replaced with a date filter
    and b.day >= '1969-12-31'
    and b.day <= '2025-07-09'
    -- and cg.objective_id in ($obj_id) -- need to understand how objective is being used in the dashboard
group by
    1,2
order by
    1,2

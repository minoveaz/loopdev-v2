-- Tenant-scoped aggregate read functions for Platform Analytics.
-- Functions intentionally expose only approved metric identifiers and verify
-- organization membership before reading any rows.

create or replace function public.platform_analytics_time_series(
  p_metric_id text,
  p_organization_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_interval text default 'day'
)
returns table(bucket timestamptz, value numeric)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_organization_member(p_organization_id) then
    raise exception 'analytics organization access denied';
  end if;

  if p_interval not in ('day', 'week', 'month') then
    raise exception 'unsupported analytics interval';
  end if;

  if p_metric_id = 'crm.contacts' then
    return query
      select date_trunc(p_interval, c.created_at), count(*)::numeric
      from public.crm_contacts c
      where c.organization_id = p_organization_id
        and c.archived_at is null
        and c.created_at >= p_from and c.created_at < p_to
      group by 1 order by 1;
  elsif p_metric_id = 'crm.open_leads' then
    return query
      select date_trunc(p_interval, l.created_at), count(*)::numeric
      from public.crm_leads l
      where l.organization_id = p_organization_id
        and l.archived_at is null
        and l.status not in ('converted', 'inactive')
        and l.created_at >= p_from and l.created_at < p_to
      group by 1 order by 1;
  elsif p_metric_id in ('crm.open_opportunities', 'crm.pipeline_value') then
    return query
      select date_trunc(p_interval, o.created_at),
        case when p_metric_id = 'crm.open_opportunities' then count(*)::numeric else coalesce(sum(o.amount), 0)::numeric end
      from public.crm_opportunities o
      where o.organization_id = p_organization_id
        and o.archived_at is null
        and o.stage_key in ('prospecting', 'qualified', 'proposal', 'negotiation', 'propuesta', 'negociacion')
        and o.created_at >= p_from and o.created_at < p_to
      group by 1 order by 1;
  elsif p_metric_id like 'document_intelligence.%' then
    return query
      select date_trunc(p_interval, e.created_at),
        case
          when p_metric_id = 'document_intelligence.processed' then count(*)::numeric
          when p_metric_id = 'document_intelligence.pending_review' then count(*) filter (where e.status = 'review')::numeric
          when p_metric_id = 'document_intelligence.average_confidence' then coalesce(avg((e.fields->>'overallConfidence')::numeric), 0) * 100
          when p_metric_id = 'document_intelligence.estimated_cost' then coalesce(sum((e.fields->'usage'->>'estimatedCostUsd')::numeric), 0)
          else 0
        end
      from public.document_intelligence_extractions e
      where e.organization_id = p_organization_id
        and e.created_at >= p_from and e.created_at < p_to
      group by 1 order by 1;
  else
    raise exception 'unsupported analytics metric';
  end if;
end;
$$;

create or replace function public.platform_analytics_breakdown(
  p_metric_id text,
  p_organization_id uuid,
  p_from timestamptz default '-infinity',
  p_to timestamptz default 'infinity'
)
returns table(key text, value numeric)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_organization_member(p_organization_id) then
    raise exception 'analytics organization access denied';
  end if;

  if p_metric_id = 'crm.pipeline_by_stage' then
    return query
    select o.stage_key::text, count(*)::numeric
      from public.crm_opportunities o
      where o.organization_id = p_organization_id and o.archived_at is null
        and o.created_at >= p_from and o.created_at < p_to
      group by o.stage_key order by o.stage_key;
  elsif p_metric_id = 'document_intelligence.by_status' then
    return query
      select e.status::text, count(*)::numeric
      from public.document_intelligence_extractions e
      where e.organization_id = p_organization_id
        and e.created_at >= p_from and e.created_at < p_to
      group by e.status order by e.status;
  else
    raise exception 'unsupported analytics breakdown';
  end if;
end;
$$;

revoke all on function public.platform_analytics_time_series(text, uuid, timestamptz, timestamptz, text) from public;
revoke all on function public.platform_analytics_breakdown(text, uuid, timestamptz, timestamptz) from public;
grant execute on function public.platform_analytics_time_series(text, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.platform_analytics_breakdown(text, uuid, timestamptz, timestamptz) to authenticated;

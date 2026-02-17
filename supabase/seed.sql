-- Seed data for AI Signals Radar development
-- Run this after creating a test user via the Supabase Auth dashboard

-- Sample data sources
INSERT INTO public.data_sources (id, name, source_type, config, is_active, scan_frequency_hours) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'EdWeek RSS', 'rss', '{"url": "https://www.edweek.org/feed"}', true, 6),
  ('a1000000-0000-0000-0000-000000000002', 'EdSurge RSS', 'rss', '{"url": "https://www.edsurge.com/feed"}', true, 6),
  ('a1000000-0000-0000-0000-000000000003', 'SAM.gov Education Grants', 'api', '{"keyword": "K-12 education technology", "naics": "611110"}', true, 12),
  ('a1000000-0000-0000-0000-000000000004', 'Board Minutes Search', 'ai_search', '{"query_template": "school board minutes technology budget 2026"}', true, 24),
  ('a1000000-0000-0000-0000-000000000005', 'Competitor Intel Search', 'ai_search', '{"query_template": "K-12 edtech contract award renewal 2026"}', true, 24);

-- Sample signals
INSERT INTO public.signals (id, source_type, source_url, title, raw_content, published_at, region, signal_category, metadata) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'rss', 'https://example.com/grant-1', 'ESSER Funding Extension: New Deadline for Technology Spending', 'The Department of Education has announced an extension for ESSER fund expenditures related to educational technology. Districts now have until September 2026 to allocate remaining funds for technology infrastructure, digital learning platforms, and related professional development. This affects approximately $2.3 billion in unspent technology allocations.', '2026-02-10T10:00:00Z', 'US', 'grant', '{"feedTitle": "EdWeek"}'),

  ('b1000000-0000-0000-0000-000000000002', 'sam_gov', 'https://sam.gov/opp/example-rfp-1', 'RFP: Student Assessment Platform for Chicago Public Schools', 'Chicago Public Schools is seeking proposals for a comprehensive student assessment platform. Requirements include formative and summative assessment capabilities, real-time data dashboards, standards alignment, and integration with existing SIS. Budget: $2.5M over 3 years. Deadline: April 15, 2026.', '2026-02-12T14:00:00Z', 'IL', 'rfp', '{"naics": "611110", "budget": "$2.5M"}'),

  ('b1000000-0000-0000-0000-000000000003', 'rss', 'https://example.com/board-minutes-1', 'Denver Public Schools Board Discusses SEL Technology Investment', 'At the February board meeting, DPS board members voted to allocate $1.2M from Title IV funds toward social-emotional learning technology solutions. The district is prioritizing tools that integrate with existing MTSS frameworks and provide real-time progress monitoring for counselors and administrators.', '2026-02-14T09:00:00Z', 'CO', 'board_minutes', '{"feedTitle": "District Administration"}'),

  ('b1000000-0000-0000-0000-000000000004', 'ai_search', 'https://example.com/competitor-news-1', 'Renaissance Learning Wins Major Contract with Houston ISD', 'Renaissance Learning has secured a 5-year, $8.5M contract with Houston Independent School District for their Star Assessment platform. The contract includes implementation support, professional development, and data integration services. The contract was awarded after a competitive RFP process.', '2026-02-13T11:00:00Z', 'TX', 'competitor', '{"competitor": "Renaissance Learning"}'),

  ('b1000000-0000-0000-0000-000000000005', 'rss', 'https://example.com/news-1', 'Federal Budget Proposal Increases Title I Funding by 12%', 'The president''s FY2027 budget proposal includes a 12% increase in Title I funding, bringing the total to $19.4 billion. Education advocates note this is the largest proposed increase in a decade. The additional funds could significantly impact district purchasing decisions for supplemental instruction programs and technology.', '2026-02-15T08:00:00Z', 'US', 'news', '{"feedTitle": "EdWeek"}'),

  ('b1000000-0000-0000-0000-000000000006', 'sam_gov', 'https://sam.gov/opp/example-grant-1', 'Grant: Innovative Approaches to Literacy Program (IAL)', 'The Department of Education invites applications for the Innovative Approaches to Literacy Program. Eligible applicants include LEAs serving high-poverty areas. Funding supports comprehensive literacy programs for birth through grade 12. Estimated total funding: $27M. Application deadline: May 1, 2026.', '2026-02-11T16:00:00Z', 'US', 'grant', '{"naics": "611110", "totalFunding": "$27M"}'),

  ('b1000000-0000-0000-0000-000000000007', 'ai_search', 'https://example.com/policy-1', 'California Passes New Data Privacy Requirements for EdTech', 'California Governor signed AB-1234 into law, establishing new data privacy requirements for educational technology vendors serving K-12 students. The law requires annual privacy audits, parental consent for data collection, and data deletion upon student transfer. Compliance deadline: January 2027.', '2026-02-16T12:00:00Z', 'CA', 'policy', '{}'),

  ('b1000000-0000-0000-0000-000000000008', 'rss', 'https://example.com/rfp-2', 'Miami-Dade County Seeking Professional Development Platform Vendor', 'Miami-Dade County Public Schools has released an RFP for a professional development management and delivery platform. Requirements include micro-credentialing, competency tracking, video-based coaching tools, and LMS integration. Estimated contract value: $1.8M. Proposals due March 30, 2026.', '2026-02-14T15:00:00Z', 'FL', 'rfp', '{"budget": "$1.8M"}'),

  ('b1000000-0000-0000-0000-000000000009', 'rss', 'https://example.com/news-2', 'Survey: 78% of Districts Plan to Increase EdTech Spending in 2026-27', 'A new survey of 500+ district technology directors reveals that 78% plan to increase their educational technology budgets for the 2026-27 school year. Top spending priorities include AI-powered tutoring (42%), cybersecurity (38%), and student data analytics (35%). Rural districts show the steepest planned increases.', '2026-02-16T10:00:00Z', 'US', 'news', '{"feedTitle": "EdSurge"}'),

  ('b1000000-0000-0000-0000-000000000010', 'ai_search', 'https://example.com/board-minutes-2', 'Fairfax County Schools Approves $5M Safety Technology Upgrade', 'The Fairfax County School Board approved a $5M investment in school safety technology, including visitor management systems, emergency communication platforms, and AI-powered threat detection cameras. Implementation begins summer 2026 across all 198 schools.', '2026-02-15T14:00:00Z', 'VA', 'board_minutes', '{}');

-- Sample pipeline runs
INSERT INTO public.pipeline_runs (data_source_id, status, signals_found, started_at, completed_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'completed', 3, '2026-02-17T06:00:00Z', '2026-02-17T06:01:30Z'),
  ('a1000000-0000-0000-0000-000000000002', 'completed', 2, '2026-02-17T06:00:00Z', '2026-02-17T06:02:00Z'),
  ('a1000000-0000-0000-0000-000000000003', 'completed', 2, '2026-02-17T00:00:00Z', '2026-02-17T00:03:00Z'),
  ('a1000000-0000-0000-0000-000000000004', 'completed', 1, '2026-02-17T08:00:00Z', '2026-02-17T08:01:00Z'),
  ('a1000000-0000-0000-0000-000000000005', 'completed', 2, '2026-02-17T08:00:00Z', '2026-02-17T08:02:00Z'),
  ('a1000000-0000-0000-0000-000000000001', 'failed', 0, '2026-02-16T18:00:00Z', '2026-02-16T18:00:30Z');

-- NOTE: To seed signal_matches and digests, you need a real user.
-- After creating a user and their signal_profile, run:
--
-- INSERT INTO public.signal_matches (signal_id, user_id, relevance_score, why_it_matters, action_suggestion) VALUES
--   ('b1000000-0000-0000-0000-000000000001', '<YOUR_USER_ID>', 0.87, 'ESSER fund extension directly impacts your target districts'' ability to purchase educational technology. The $2.3B in unspent funds creates an immediate buying window.', 'Identify your top 10 target districts and check their ESSER spending status. Reach out with messaging around the new deadline.'),
--   ('b1000000-0000-0000-0000-000000000002', '<YOUR_USER_ID>', 0.72, 'Chicago Public Schools is a bellwether district. Their $2.5M assessment platform RFP aligns with your solution category.', 'Review the full RFP requirements. If your platform qualifies, prepare a response before the April 15 deadline.'),
--   ... etc

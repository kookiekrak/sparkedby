-- Create a test user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'e5c0c7e8-58c0-4eaa-9d5c-b96f1a532e45',
  'authenticated',
  'authenticated',
  'test@localhost',
  -- Password: 321test
  '$2a$10$Gh6OxOq/zq/y.qFTjy.UXeiennOGzdgEBxE.CHRQu8y19bjBQL7sy',
  now(),
  null,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Update first user's profile
UPDATE public.user_profiles 
SET 
  name = 'John Smith',
  specialty = 'Cardiology',
  updated_at = now()
WHERE id = 'e5c0c7e8-58c0-4eaa-9d5c-b96f1a532e45';

-- Create another test user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'f6d8c9e7-49b1-3daa-8c4b-a85e2a431d56',
  'authenticated',
  'authenticated',
  'sarah@localhost',
  -- Password: 321test
  '$2a$10$Gh6OxOq/zq/y.qFTjy.UXeiennOGzdgEBxE.CHRQu8y19bjBQL7sy',
  now(),
  null,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Update first user's profile
UPDATE public.user_profiles 
SET 
  name = 'Sarah Johnson',
  specialty = 'Neurology',
  updated_at = now()
WHERE id = 'f6d8c9e7-49b1-3daa-8c4b-a85e2a431d56';

--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."visits" ("id", "user_id", "started_at", "ended_at", "created_at", "updated_at", "metadata", "state", "name", "patient_id") VALUES
	('c87e7c58-cc51-478a-aff1-67b3b4864d27', 'e5c0c7e8-58c0-4eaa-9d5c-b96f1a532e45', '2025-03-12 20:12:31.887353+00', NULL, '2025-03-12 20:12:31.887353+00', '2025-03-12 20:16:12.559191+00', '{}', 'processing', NULL, NULL);


--
-- Data for Name: containers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."containers" ("id", "visit_id", "chunk_id", "transcript_fragment", "state", "error_message", "started_at", "completed_at", "created_at", "updated_at", "metadata") VALUES
	('8124c61f-17bd-4ed0-9fee-402586e0e33e', 'c87e7c58-cc51-478a-aff1-67b3b4864d27', 1234, 'come in Miss Bellamy yes hi kind of hear us I''ll be your doctor today let me just wash my hands really quick would you prefer Miss Bellamy or would can I call you Pat Pat''s fine great well it''s nice to meet you nice to meet you can you tell me why you''re here today I have a terrible headache looks really bad yes is there anything anything else besides your headache that you want to address here today at the clinic appartment no just that except I am concerned I just recently changed insurance companies and I''m not sure this is going to be covered yet all right was there anything because what we can do is while we''re talking and I''m doing your history and physical I will have my office secretary looking the insurance plan that you have all right so you don''t have to worry about that that sounds good okay sounds great is there anything else no I just this is just really bad okay okay so what I''d like to do today and is let''s let''s take a look at what''s causing your headache I will go over history physical and then we''ll do again a physical exam and then we will look into your insurance policy and make sure that''s all okay you know taking care of that sound like a good plan for you that''s that''s good perfect so tell me a little bit more about this the head head pain that you''re having well it started about 3 days ago and nothing has helped it just laid me flat I haven''t been able to go to work it''s nothing''s helped I it''s all over It really bad when I move so I''m trying not to move too much and the light is bothering me a lot okay and unfortunately I can''t dim the lights in this room but so I''ll try to go quickly and would it be okay if I took some notes oh sure all right so you said this headache started about 3 days ago okay was there any anything that brought it on anything unusual that happened maybe three days ago not really no okay can you tell me anything that makes it better is oh nothing''s made it better I took some Tylenol I tried Motrin nothing I just try not to move too much all right is there anything that makes it worse yeah like movement and and light okay and it''s just constant though there''s you know it doesn''t it''s just constant it''s all over okay so if you had to rate on a Pain Scale zero being no pain 10 being the worst pain you ever had oh it''s a 10 a 10 I''ve never had a headache like this okay yeah that sounds really bad now as far as radiation does it move does that you said the head the pain is all up it''s kind of all over but it also I''ve got this shooting pain down my neck and my neck is is very stiff okay but it''s not it''s the entire head entire head okay yeah as far as in the in the timing you said that started three days ago but is it you said is a constant yeah it started gradually but once once it got there it''s hasn''t gone away it doesn''t get better it doesn''t get worse it''s just the same okay so do you what I want to get is your perception of what you think is going on I don''t know I just I can hardly think it''s so painful I just because it''s so bad I was afraid my neighbor had a headache and ignored it last year and he suddenly started having seizures and it turns out he had a a brain tumor so I thought I just should come in and yeah I can understand your concern what how is it impacting your daily life I can''t go to work I can''t do anything yeah so it sounds like it''s really impacting your life yeah I can''t if it''s okay I would like to go so talk about a little bit about your medical history and your social history all right can you tell me as far as your medical history have do you have any medical conditions I should be aware of not I was diagnosed with high blood pressure about three years ago but we''ve been addressing it with diet changes and been monitor yeah I go in yearly I had been just and it''s been well controlled so okay great I haven''t been on medication but other than that I haven''t had any problems okay any surgical history no any hospitalizations no all right and you said you''re the only medicine you''re taking was the talent on law train yeah and they didn''t help yeah okay just wanted to verify do you have any drug allergies no no okay what about family history do you have any medical history of headaches or in my family right you know my mom said she used to get migraines when she was in her 20s and 30s okay but I don''t remember her saying anything else about it my sister I have one sister she''s she''s healthy my dad he has high blood pressure other than that he''s healthy and that''s about it I don''t I don''t have any kids all right it''s all right I would like to ask you some social History questions that just for there are records do you smoke yeah I do okay is it cigarettes or chewing yeah and how much do you smoke about a half a pack a day okay what about alcohol I don''t drink okay also are you married yeah I''m married okay and children no okay and just some some just some additional questions is looking at kind of gy in history are you less menstrual period oh I''m in menopause okay yeah so going back into the history again have you you said your mom had migraines earlier on have you been around and you know other you haven''t been nauseous or have you been yeah there I''ve been nauseous okay in fact I threw up twice early on okay because when I move it makes me nauseous okay nothing out of the ordinary over the past couple weeks have you been on any trips or anything or actually a week ago I was in North Carolina for a family reunion okay and there was a four-year-old who was sick there I don''t know what they had but they I guess I guess they ended up taking them into emergency know so let me just so summarize to make sure I''ve got everything straight so far is you started an onset of a severe headache about 3 days ago it''s worse with movement light really makes it hurt bad it''s a 10 out of 10 pain and you''re also complaining of a stiff neck with that yes it came on gradually and it''s been constant pain in the frontal area medical history you''re in hyper you have high blood pressure but that''s controlled with diet no surgical history no ear hospitalizations the pain though is really impacting your day-to-day living and daily life you to tried Tylenol mult it didn''t help otherwise no medications you''ve got the family history of your mom with migraines otherwise you''re family is healthy yeah you smoke about a half a pack a day you don''t drink and then you were you you said you took a trip about a week ago or two weeks ago yeah okay a week ago yeah I don''t know it was in North Carolina all right yeah I can understand your concern you about your friend you said that was having seizures I''ve just never had this kind of pain before yeah and I can understand that and you know so what I would like to do is we''ve pretty much gone over your the history what I''d like to do is complete a physical exam okay do some testing all right and I want to ask too if there''s any other concerns I need to address before we get to that final exam okay that that sounds good okay sounds great okay all right ', 'completed', NULL, NULL, NULL, '2025-03-12 20:13:09.359902+00', '2025-03-12 20:13:09.359902+00', '{}');


--
-- Data for Name: template_library; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."template_library" ("id", "name", "description", "prompt", "sample_output", "specialty", "tags", "owner_id", "created_at", "updated_at", "type", "version_id", "published") VALUES
	('42c584bf-120f-4c15-b040-cce9e649f882', 'Referral Letter', '', 'Dear [Insert Name of clinician the letter is addressed to],

Thank you for seeing the patient below.

Re: [Patient''s Full Name]

I am writing to refer my patient, [Patient''s Full Name], who is known with [Medical Condition 1, Medical Condition 2 etc] and is currently using [Medication 1, Medication 2 etc]. 

They presented to me today with the following problem [History of presenting complaint, Reason for visit, Issues discused etc]

Your expertise would be greatly appreciated in assisting with further management strategies for this patient.

Thank you for your attention to this matter.

Yours sincerely,
[Clinician''s title, name and surname]
[Clinician type/Specialty]

(Never make up any details about the clinician, the patient and the patients medical history, examination findings, assessment, diagnoses or management plan.)', NULL, NULL, NULL, NULL, '2025-03-05 08:44:39.422845+00', '2025-03-05 08:44:39.422845+00', 'document', 1, false),
	('367dabc9-c882-4486-bbbb-20b77857aa8c', 'SMART Goals', NULL, 'SMART Goal 1 (repeat template below for number of goals specified)

Patient problems/needs/relevant conditions:
- [Briefly state the relevant problem, need or condition for SMART goal 1]

Goals - changes to be achieved:
- [Briefly state or list the goal(s) or changes to be achieved by the patient for SMART goal 1]

Required treatments and services, including patient actions:
- [Briefly state or list the treatments and services required to reach the above goals, including any actions to be taken by the patient]

Arrangements for treatment/services (when, who, contact details)
- [Briefly state or list what actions the doctor has taken or arrangement they will make to assist the patient in accessing the required treatments and services, including any relevant dates, clinician information and contact details for the services]

SMART Goal 2 (only include SMART Goal 2, 3, 4 etc if the relevant SMART goals have been stated in the consult note or transcript; use the same template above for each SMART Goal listed)', NULL, NULL, NULL, NULL, '2025-03-05 09:09:16.358177+00', '2025-03-05 09:09:16.358177+00', 'document', 1, false),
	('fbf7f429-d835-42e3-ba5b-d94954cba52a', 'SOAP - Problem Based', NULL, 'Subjective:
- [Mention reasons for visit, chief complaints such as requests, symptoms etc] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Duration/timing/location/quality/severity/context of complaint] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention List anything that worsens or alleviates the symptoms, including self-treatment attempts and their effectiveness] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Progression: Mention describe how the symptoms have changed or evolved over time] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Previous episodes: Mention detail any past occurrences of similar symptoms, including when they occurred, how they were managed, and the outcomes] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Impact on daily activities: explain how the symptoms affect the patient''s daily life, work, and activities.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Associated symptoms: Mention any other symptoms (focal and systemic) that accompany the reasons for visit & chief complaints] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)

Past Medical History:
- [Mention Contributing factors including past medical and surgical history, investigations, treatments, relevant to the reasons for visit and chief complaints]
- [Mention Social history that may be relevant to the reasons for visit and chief complaints.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Family history that may be relevant to the reasons for visit and chief complaints.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Exposure history] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Immunization history & status] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Other: Mention Any other relevant subjective information] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)

Objective:
- [Vitals signs (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Physical or mental state examination findings, including system specific examination(s) (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Investigations with results] (you must only include completed investigations and the results of these investigations have been explicitly mentioned in the transcript, contextual notes or clinical note, otherwise you must leave investigations with results blank. All planned or ordered investigations must not be included under Objective; instead all planned or ordered investigations must be included under Plan.)

Assessment & Plan:
[1. Issue, problem or request 1 (issue, request, topic or condition name only)]
- [Assessment, likely diagnosis for Issue 1 (condition name only)]
- [Differential diagnosis for Issue 1 (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Investigations planned for Issue 1 (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Treatment planned for Issue 1 (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Relevant referrals for Issue 1 (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]

[2. Issue, problem or request 2 (issue, request, topic or condition name only)]
- [Assessment, likely diagnosis for Issue 2 (condition name only)]
- [Differential diagnosis for Issue 2 (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Investigations planned for Issue 2 (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Treatment planned for Issue 2 (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Relevant referrals for Issue 2 (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]

[3. Issue, problem or request 3, 4, 5 etc (issue, request, topic or condition name only)]
- [Assessment, likely diagnosis for Issue 3, 4, 5 etc (condition name only)]
- [Differential diagnosis for Issue 3, 4, 5 etc (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Investigations planned for Issue 3, 4, 5 etc (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Treatment planned for Issue 3, 4, 5 etc (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Relevant referrals for Issue 3, 4, 5 etc (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
(Never come up with your own assessment, plan, interventions, evaluation, and plan for continuing care - use only the transcript, contextual notes or clinical note as a reference for the information include in your note.)

(Never come up with your own patient details, assessment, plan, interventions, evaluation, and plan for continuing care - use only the transcript, contextual notes or clinical note as a reference for the information include in your note.)', NULL, NULL, NULL, NULL, '2025-03-05 09:10:04.784522+00', '2025-03-05 09:10:04.784522+00', 'note', 1, false),
	('4d103775-2aeb-4bd1-8a02-ccac675ac9a1', 'SOAP', NULL, 'Subjective:
- [Mention reasons for visit, chief complaints such as requests, symptoms etc] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Duration/timing/location/quality/severity/context of complaint] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention List anything that worsens or alleviates the symptoms, including self-treatment attempts and their effectiveness] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Progression: Mention describe how the symptoms have changed or evolved over time] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Previous episodes: Mention detail any past occurrences of similar symptoms, including when they occurred, how they were managed, and the outcomes] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Impact on daily activities: explain how the symptoms affect the patient''s daily life, work, and activities.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Associated symptoms: Mention any other symptoms (focal and systemic) that accompany the reasons for visit & chief complaints] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)

Past Medical History:
- [Mention Contributing factors including past medical and surgical history, investigations, treatments, relevant to the reasons for visit and chief complaints]
- [Mention Social history that may be relevant to the reasons for visit and chief complaints.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Family history that may be relevant to the reasons for visit and chief complaints.] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Exposure history] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Mention Immunization history & status] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)
- [Other: Mention Any other relevant subjective information] (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)

Objective:
- [Vitals signs (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Physical or mental state examination findings, including system specific examination(s) (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Investigations with results] (you must only include completed investigations and the results of these investigations have been explicitly mentioned in the transcript, contextual notes or clinical note, otherwise you must leave investigations with results blank. All planned or ordered investigations must not be included under Objective; instead all planned or ordered investigations must be included under Plan.)

Assessment:
- [Likely diagnosis (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Differential diagnosis (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]

Plan:
- [Investigations planned (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Treatment planned (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]
- [Relevant other actions such as counselling, referrals etc (only include if explicitly mentioned in the transcript, contextual notes or clinical note, otherwise leave blank)]

(Never come up with your own patient details, assessment, plan, interventions, evaluation, and plan for continuing care - use only the transcript, contextual notes or clinical note as a reference for the information include in your note.)', NULL, NULL, NULL, NULL, '2025-03-10 01:40:59.360193+00', '2025-03-10 01:40:59.360193+00', 'note', 1, false),
	('2539c834-0f81-40a2-98a3-b422190bb643', 'Patient Instructions', NULL, 'Date: [Date of visit]

Dear [Patient Name],

Thank you for visiting [Clinician/Facility Name] today. We appreciate your commitment to discussing your health concerns with us.

Summary of Clinician’s Instructions:
- [Instruction #1 (Include only if directly mentioned by the clinician)]
- [Instruction #2 (Include only if directly mentioned by the clinician)]
- [Instruction #3 (Include only if directly mentioned by the clinician)]
(…continue as needed…)

(Lifestyle Advice: Include only if the clinician provided specific lifestyle advice; otherwise, leave blank.)

(Follow-Up Appointment: Include only if the clinician instructed a follow-up appointment; otherwise, leave blank.)

(Insurance: Include only if the clinician specifically discussed insurance or coverage details; otherwise, leave blank.)

"Please note that this information is provided for reference only and is not intended as medical advice. Consult your Clinician with any questions or concerns about your health."

Warm regards,

[Clinician Name]', NULL, NULL, NULL, NULL, '2025-03-11 20:36:36.817965+00', '2025-03-11 20:36:36.817965+00', 'document', 1, false);


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notes" ("id", "visit_id", "content", "created_at", "updated_at", "metadata", "type", "user_facing", "template_id", "version_id") VALUES
	('70800005-2712-4ee7-92bc-83a4c72bcd85', 'c87e7c58-cc51-478a-aff1-67b3b4864d27', 'N/A', '2025-03-12 20:15:29.757982+00', '2025-03-12 20:15:29.757982+00', '{}', 'ai_context', true, NULL, 1);


--
-- Data for Name: transcripts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."transcripts" ("id", "visit_id", "full_text", "created_at", "updated_at", "metadata") VALUES
	('196c28de-7fe6-442f-807a-4961e9125381', 'c87e7c58-cc51-478a-aff1-67b3b4864d27', 'come in Miss Bellamy yes hi kind of hear us I''ll be your doctor today let me just wash my hands really quick would you prefer Miss Bellamy or would can I call you Pat Pat''s fine great well it''s nice to meet you nice to meet you can you tell me why you''re here today I have a terrible headache looks really bad yes is there anything anything else besides your headache that you want to address here today at the clinic appartment no just that except I am concerned I just recently changed insurance companies and I''m not sure this is going to be covered yet all right was there anything because what we can do is while we''re talking and I''m doing your history and physical I will have my office secretary looking the insurance plan that you have all right so you don''t have to worry about that that sounds good okay sounds great is there anything else no I just this is just really bad okay okay so what I''d like to do today and is let''s let''s take a look at what''s causing your headache I will go over history physical and then we''ll do again a physical exam and then we will look into your insurance policy and make sure that''s all okay you know taking care of that sound like a good plan for you that''s that''s good perfect so tell me a little bit more about this the head head pain that you''re having well it started about 3 days ago and nothing has helped it just laid me flat I haven''t been able to go to work it''s nothing''s helped I it''s all over It really bad when I move so I''m trying not to move too much and the light is bothering me a lot okay and unfortunately I can''t dim the lights in this room but so I''ll try to go quickly and would it be okay if I took some notes oh sure all right so you said this headache started about 3 days ago okay was there any anything that brought it on anything unusual that happened maybe three days ago not really no okay can you tell me anything that makes it better is oh nothing''s made it better I took some Tylenol I tried Motrin nothing I just try not to move too much all right is there anything that makes it worse yeah like movement and and light okay and it''s just constant though there''s you know it doesn''t it''s just constant it''s all over okay so if you had to rate on a Pain Scale zero being no pain 10 being the worst pain you ever had oh it''s a 10 a 10 I''ve never had a headache like this okay yeah that sounds really bad now as far as radiation does it move does that you said the head the pain is all up it''s kind of all over but it also I''ve got this shooting pain down my neck and my neck is is very stiff okay but it''s not it''s the entire head entire head okay yeah as far as in the in the timing you said that started three days ago but is it you said is a constant yeah it started gradually but once once it got there it''s hasn''t gone away it doesn''t get better it doesn''t get worse it''s just the same okay so do you what I want to get is your perception of what you think is going on I don''t know I just I can hardly think it''s so painful I just because it''s so bad I was afraid my neighbor had a headache and ignored it last year and he suddenly started having seizures and it turns out he had a a brain tumor so I thought I just should come in and yeah I can understand your concern what how is it impacting your daily life I can''t go to work I can''t do anything yeah so it sounds like it''s really impacting your life yeah I can''t if it''s okay I would like to go so talk about a little bit about your medical history and your social history all right can you tell me as far as your medical history have do you have any medical conditions I should be aware of not I was diagnosed with high blood pressure about three years ago but we''ve been addressing it with diet changes and been monitor yeah I go in yearly I had been just and it''s been well controlled so okay great I haven''t been on medication but other than that I haven''t had any problems okay any surgical history no any hospitalizations no all right and you said you''re the only medicine you''re taking was the talent on law train yeah and they didn''t help yeah okay just wanted to verify do you have any drug allergies no no okay what about family history do you have any medical history of headaches or in my family right you know my mom said she used to get migraines when she was in her 20s and 30s okay but I don''t remember her saying anything else about it my sister I have one sister she''s she''s healthy my dad he has high blood pressure other than that he''s healthy and that''s about it I don''t I don''t have any kids all right it''s all right I would like to ask you some social History questions that just for there are records do you smoke yeah I do okay is it cigarettes or chewing yeah and how much do you smoke about a half a pack a day okay what about alcohol I don''t drink okay also are you married yeah I''m married okay and children no okay and just some some just some additional questions is looking at kind of gy in history are you less menstrual period oh I''m in menopause okay yeah so going back into the history again have you you said your mom had migraines earlier on have you been around and you know other you haven''t been nauseous or have you been yeah there I''ve been nauseous okay in fact I threw up twice early on okay because when I move it makes me nauseous okay nothing out of the ordinary over the past couple weeks have you been on any trips or anything or actually a week ago I was in North Carolina for a family reunion okay and there was a four-year-old who was sick there I don''t know what they had but they I guess I guess they ended up taking them into emergency know so let me just so summarize to make sure I''ve got everything straight so far is you started an onset of a severe headache about 3 days ago it''s worse with movement light really makes it hurt bad it''s a 10 out of 10 pain and you''re also complaining of a stiff neck with that yes it came on gradually and it''s been constant pain in the frontal area medical history you''re in hyper you have high blood pressure but that''s controlled with diet no surgical history no ear hospitalizations the pain though is really impacting your day-to-day living and daily life you to tried Tylenol mult it didn''t help otherwise no medications you''ve got the family history of your mom with migraines otherwise you''re family is healthy yeah you smoke about a half a pack a day you don''t drink and then you were you you said you took a trip about a week ago or two weeks ago yeah okay a week ago yeah I don''t know it was in North Carolina all right yeah I can understand your concern you about your friend you said that was having seizures I''ve just never had this kind of pain before yeah and I can understand that and you know so what I would like to do is we''ve pretty much gone over your the history what I''d like to do is complete a physical exam okay do some testing all right and I want to ask too if there''s any other concerns I need to address before we get to that final exam okay that that sounds good okay sounds great okay all right ', '2025-03-12 20:13:49.151865+00', '2025-03-12 20:13:49.151865+00', '{}');


--
-- Data for Name: user_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;

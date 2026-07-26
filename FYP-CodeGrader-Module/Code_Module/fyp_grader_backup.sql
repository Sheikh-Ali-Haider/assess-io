--
-- PostgreSQL database dump
--

\restrict OuLvlMIntShSrJ7TwfNo2DlswKBfDV7KkSJzDAgfeMAHxfb8YawnfpDkWri4s5R

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id character varying NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    topic character varying NOT NULL,
    language character varying NOT NULL,
    sample_solution text,
    num_test_cases integer,
    test_cases text,
    status character varying,
    created_at timestamp without time zone,
    course_id integer,
    week_id integer,
    due_date character varying,
    file_path character varying,
    assignment_type character varying,
    total_marks double precision DEFAULT 100.0
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    code character varying NOT NULL,
    title character varying NOT NULL,
    description character varying,
    assigned_teacher_id integer,
    credit_hours integer,
    semester character varying,
    capacity integer,
    created_at timestamp without time zone
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    student_id integer NOT NULL,
    course_id integer NOT NULL
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id character varying NOT NULL,
    student_id character varying NOT NULL,
    assignment_id character varying,
    problem_id character varying NOT NULL,
    language character varying,
    source_code text,
    score integer,
    passed integer,
    total integer,
    test_results text,
    status character varying,
    ai_feedback text,
    submitted_at timestamp without time zone,
    submission_type character varying,
    file_path character varying,
    standardized_score double precision
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    role character varying NOT NULL,
    department character varying,
    specialization character varying,
    matric_number character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: week_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.week_materials (
    id integer NOT NULL,
    week_id integer NOT NULL,
    type character varying NOT NULL,
    name character varying NOT NULL,
    url character varying NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.week_materials OWNER TO postgres;

--
-- Name: week_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.week_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.week_materials_id_seq OWNER TO postgres;

--
-- Name: week_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.week_materials_id_seq OWNED BY public.week_materials.id;


--
-- Name: weeks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weeks (
    id integer NOT NULL,
    course_id integer NOT NULL,
    number integer NOT NULL,
    title character varying NOT NULL,
    start_date character varying,
    lessons text
);


ALTER TABLE public.weeks OWNER TO postgres;

--
-- Name: weeks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.weeks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.weeks_id_seq OWNER TO postgres;

--
-- Name: weeks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.weeks_id_seq OWNED BY public.weeks.id;


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: week_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.week_materials ALTER COLUMN id SET DEFAULT nextval('public.week_materials_id_seq'::regclass);


--
-- Name: weeks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weeks ALTER COLUMN id SET DEFAULT nextval('public.weeks_id_seq'::regclass);


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, title, description, topic, language, sample_solution, num_test_cases, test_cases, status, created_at, course_id, week_id, due_date, file_path, assignment_type, total_marks) FROM stdin;
d958ec75-210e-4c4d-a84e-760b7ee0a405	Exploring Machine Learning in Everyday Life	This assignment introduces students to the fundamentals of Machine Learning and its role in modern technology. Students will research and explain the concept of Machine Learning, distinguish it from Artificial Intelligence, and identify real-world applications that impact daily life.	General	N/A	Understanding of Machine Learning concepts - 2 marks\r\nExplanation of AI vs ML - 2 marks\r\nQuality and relevance of application examples - 3 marks\r\nDiscussion of importance and impact - 2 marks\r\nOrganization, clarity, and formatting - 1 mark\r\nTotal - 10	0	[]	ready	2026-06-19 21:24:40.498404	1	1	2026-06-22	/uploads/0a2959cd-afb4-4cd2-87a6-4f9bd144b633.pdf	document	10
c50b2484-77c8-4b1b-8600-3be433a5ffc7	Assignment 01 Info Sec	This assignment will help students understand real-world cyberattacks and how the Defense-inDepth strategy can be used to prevent them.\r\n\r\nPart 1: Mini Scenario (5 Marks)\r\nWrite a short paragraph (5–7 lines) describing a cyberattack. You may choose any one of the following types:\r\n• Data Breach\r\n• Distributed Denial of Service (DDoS) Attack\r\n• Phishing Attack\r\n• Malware/Ransomware Attack\r\n\r\nInstructions:\r\n• Clearly describe what happened in the attack\r\n• Mention the target (e.g., company, user, system)\r\n• Explain the impact (data loss, downtime, financial loss, etc.)\r\n\r\nPart 2: Defense-in-Depth Analysis (10 Marks)\r\nBased on your scenario, answer the following:\r\n1. Targeted Layer (5 Marks):\r\nIdentify which layer of the Defense-in-Depth model was targeted. Examples include:\r\n• Physical Layer\r\n• Network Layer\r\n• Application Layer\r\n• Endpoint/User Layer\r\nProvide a brief justification for your answer.\r\n\r\n2. Prevention Mechanism (5 Marks):\r\nSuggest one or more security mechanisms that could have prevented the attack, such as:\r\n• Firewalls\r\n• Intrusion Detection/Prevention Systems (IDS/IPS)\r\n• Encryption\r\n• Multi-Factor Authentication (MFA)\r\n• Security Awareness Training\r\nExplain how your chosen mechanism would stop or reduce the impact of the attack.	General	N/A		0	[]	ready	2026-06-20 13:13:58.449913	2	2	2026-06-22	/uploads/fc1d87f9-fc99-4173-b1a7-9ea395e061a9.pdf	handwritten	15
c41fd44e-35f8-453b-9fa9-6e2ec8e184df	Predicting Student Scores Using Linear Regression	Assignment Title: Predicting Student Scores Using Linear Regression\r\n\r\nTotal Marks: 10\r\n\r\nDescription:\r\nIn this assignment, build your first Machine Learning model using Linear Regression. Use a small dataset containing study hours and exam scores, train a model, make predictions, and interpret the results.\r\n\r\nGrading Rubric:\r\nCriteria - Marks\r\nData preparation - 2\r\nModel training - 3\r\nPredictions - 2\r\nVisualization - 2\r\nInterpretation of results - 1\r\nTotal - 10\r\n\r\nExpected Output:\r\nStudents should be able to:\r\nTrain a basic Machine Learning model.\r\nGenerate predictions using the trained model.\r\nVisualize the relationship between study hours and exam scores.\r\nUnderstand how Machine Learning can identify patterns in data and make predictions.	General	python	# Import required libraries\r\nimport pandas as pd\r\nimport numpy as np\r\nimport matplotlib.pyplot as plt\r\nfrom sklearn.linear_model import LinearRegression\r\n\r\n# Create the dataset\r\ndata = {\r\n    "Study Hours": [1, 2, 3, 4, 5, 6, 7, 8],\r\n    "Exam Score": [35, 40, 50, 55, 65, 70, 78, 85]\r\n}\r\n\r\ndf = pd.DataFrame(data)\r\n\r\n# Separate features and target\r\nX = df[["Study Hours"]]\r\ny = df["Exam Score"]\r\n\r\n# Train the Linear Regression model\r\nmodel = LinearRegression()\r\nmodel.fit(X, y)\r\n\r\n# Make predictions\r\nscore_4_5 = model.predict([[4.5]])[0]\r\nscore_7_5 = model.predict([[7.5]])[0]\r\n\r\nprint(f"Predicted score for 4.5 study hours: {score_4_5:.2f}")\r\nprint(f"Predicted score for 7.5 study hours: {score_7_5:.2f}")\r\n\r\n# Plot the data\r\nplt.scatter(X, y, label="Actual Data")\r\n\r\n# Plot regression line\r\nplt.plot(X, model.predict(X), label="Regression Line")\r\n\r\nplt.xlabel("Study Hours")\r\nplt.ylabel("Exam Score")\r\nplt.title("Study Hours vs Exam Score")\r\nplt.legend()\r\nplt.show()\r\nSample Output\r\nPredicted score for 4.5 study hours: 59.75\r\nPredicted score for 7.5 study hours: 82.54\r\n\r\n(Values may vary slightly depending on implementation.)	5	[{"input": "1\\n2\\n3\\n4\\n5\\n6\\n7\\n8\\n35\\n40\\n50\\n55\\n65\\n70\\n78\\n85", "expected_output": "Predicted score for 4.5 study hours: 59.75\\nPredicted score for 7.5 study hours: 82.50"}, {"input": "0\\n0\\n0\\n0\\n0\\n0\\n0\\n0\\n0\\n0\\n0\\n0\\n0\\n0\\n0\\n0", "expected_output": "Predicted score for 4.5 study hours: 0.00\\nPredicted score for 7.5 study hours: 0.00"}, {"input": "10\\n20\\n30\\n40\\n50\\n60\\n70\\n80\\n100\\n200\\n300\\n400\\n500\\n600\\n700\\n800", "expected_output": "Predicted score for 4.5 study hours: 45.00\\nPredicted score for 7.5 study hours: 75.00"}, {"input": "1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1", "expected_output": "Predicted score for 4.5 study hours: 1.00\\nPredicted score for 7.5 study hours: 1.00"}, {"input": "-1\\n-2\\n-3\\n-4\\n-5\\n-6\\n-7\\n-8\\n-35\\n-40\\n-50\\n-55\\n-65\\n-70\\n-78\\n-85", "expected_output": "Predicted score for 4.5 study hours: -59.75\\nPredicted score for 7.5 study hours: -82.50"}]	ready	2026-06-20 19:01:22.285952	1	4	2026-06-22	/uploads/8d73c8f1-0108-449c-b9c2-f944e200582a.pdf	code	10
5ee7ab13-e8f1-43b4-8269-9060dffb8abc	Sample ass	For this assignment, you will build your first Machine Learning model using Linear Regression to predict student scores based on study hours. Your task is to create a Python (.py) file or Jupyter Notebook (.ipynb) that includes code, outputs, and visualization. You are expected to: (1) load and prepare the given dataset using Pandas, separating the independent variable (Study Hours) and dependent variable (Exam Score); (2) train a Linear Regression model using Scikit-learn; (3) make predictions for students who study 4.5 hours and 7.5 hours; (4) visualize the results by creating a scatter plot of the original data and plotting the regression line; and (5) interpret the model's findings in 3-4 sentences. Your submission should be an individual assignment, including all code, outputs, and visualization as required.	General	N/A		0	[]	ready	2026-06-21 12:25:13.061622	1	4	2026-06-23	/uploads/7d8acc00-7242-4947-97f8-7015f3e87181.pdf	document	10
7eb8318a-4234-4c16-b885-6971cb1da624	sample ass 2	For this assignment, you will build your first Machine Learning model using Linear Regression to predict student scores based on study hours. Your task is to create a Python (.py) file or Jupyter Notebook (.ipynb) that includes code, outputs, and visualization. You are expected to: (1) load and prepare the given dataset using Pandas, separating the independent variable (Study Hours) and dependent variable (Exam Score); (2) train a Linear Regression model from Scikit-learn using the dataset; (3) make predictions for exam scores for students who study 4.5 hours and 7.5 hours; (4) visualize the results by creating a scatter plot of the original data and plotting the regression line; and (5) interpret the model's findings in 3-4 sentences. Your submission should be an individual assignment and include all the required code, outputs, and visualization.	General	N/A		0	[]	ready	2026-06-21 12:36:36.783674	1	4	2026-06-24	/uploads/8612744a-beb3-4a25-bcdf-993f40ed3bfe.pdf	handwritten	10
1b4382cd-1ece-418c-9964-6c2875b08cef	Assignment 02	This assignment is about Classical Cryptography, specifically focusing on the Playfair Cipher and Hill Cipher. You are expected to complete two parts: Part A on Playfair Cipher and Part B on Hill Cipher. In Part A, you will encrypt a given plaintext and decrypt a given ciphertext using the Playfair Cipher, following specific steps and rules. In Part B, you will encrypt a plaintext and decrypt a ciphertext using the Hill Cipher, performing matrix operations and conversions between letters and numerical values. Your submission must be handwritten, with proper headings, margins, and clear step-by-step solutions. You are allowed to take help from books or the internet for research purposes only, and plagiarism or copied work will not be accepted. Ensure you follow all instructions, including combining I/J in one cell for the Playfair Cipher, using capital letters only, and applying modulo 26 operations for the Hill Cipher. Upload your completed assignment on the Learning Management System (LMS) by the due date, 4-Jun-2026.	General	N/A		0	[]	ready	2026-06-21 13:11:07.384029	2	5	2026-06-24	/uploads/bb15fb56-a42e-42eb-a0bd-02ac7f782530.pdf	document	9
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, code, title, description, assigned_teacher_id, credit_hours, semester, capacity, created_at) FROM stdin;
1	CS102	Machine Learning	Machine Learning is a branch of Artificial Intelligence that focuses on developing algorithms and models that enable computers to learn from data and improve their performance without being explicitly programmed. It involves techniques for data analysis, pattern recognition, prediction, and decision-making, with applications in areas such as image recognition, natural language processing, recommendation systems, and predictive analytics. The course introduces fundamental concepts, algorithms, and practical applications of machine learning.	3	3	Spring 2026	30	2026-06-19 20:40:15.267284
2	CS105	Information Security	**Information Security** is a course that focuses on protecting information and information systems from unauthorized access, misuse, disclosure, disruption, modification, or destruction. The course introduces the fundamental principles of information security, including confidentiality, integrity, and availability (CIA Triad). Students will learn about common security threats, vulnerabilities, cyberattacks, risk management, access control, cryptography, network security, and security policies. The course aims to develop an understanding of how organizations protect their digital assets and maintain the security of information in today's interconnected world.	7	3	Spring 2026	30	2026-06-20 13:03:10.587247
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, student_id, course_id) FROM stdin;
13	4	1
14	5	1
15	6	1
16	4	2
17	5	2
18	6	2
19	8	2
20	9	2
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, student_id, assignment_id, problem_id, language, source_code, score, passed, total, test_results, status, ai_feedback, submitted_at, submission_type, file_path, standardized_score) FROM stdin;
1aea7314-f6a4-47fe-89d1-75a0f1072e15	4	c50b2484-77c8-4b1b-8600-3be433a5ffc7	Assignment 01 Info Sec	N/A	\N	85	\N	\N	[]	completed	{"score": 85, "summary": "The student provided a clear and concise description of a phishing attack and identified the targeted layer as the endpoint/user layer. The suggested prevention mechanisms, security awareness training and multi-factor authentication, are relevant and effective. However, the student could have provided more detailed explanations and justifications.", "suggestions": ["Provide more detailed explanations of the attack and its impact", "Include specific examples of security awareness training and multi-factor authentication implementation"], "missed_points": ["Lack of detailed justification for the targeted layer", "No discussion of potential additional security measures"], "writing_clarity": 8}	2026-06-20 13:15:31.446352	handwritten	uploads\\206d60a9-093a-4686-8eec-ffc46f105334.pdf	8.5
9b515e82-ad4e-40f4-87c2-944fbb474d8b	4	d958ec75-210e-4c4d-a84e-760b7ee0a405	Exploring Machine Learning in Everyday Life	N/A	\N	92	\N	\N	[]	completed	{"score": 92, "summary": "The submission provides a clear and comprehensive overview of Machine Learning, effectively distinguishing it from Artificial Intelligence and highlighting its real-world applications. The student demonstrates a strong understanding of the subject matter, and the submission is well-organized and easy to follow. However, there are some areas where the student could provide more depth and specific examples to further support their explanations.", "suggestions": ["Provide more detailed explanations of the machine learning algorithms used in the real-world applications", "Include more specific examples of how Machine Learning is used in various industries, such as healthcare and finance", "Discuss potential challenges and limitations of Machine Learning, such as bias in data and model interpretability"], "readability_score": 8, "time_complexity": "N/A", "space_complexity": "N/A", "missed_edge_cases": ["The student could have discussed the importance of data quality and preprocessing in Machine Learning", "The submission does not address potential ethical concerns related to Machine Learning, such as privacy and job displacement"]}	2026-06-19 21:30:36.966615	document	uploads\\53dd17b6-c2c8-4011-b215-59dcfb8a1590.pdf	9.2
955a4434-e8d7-4327-9e0e-af44514f850e	5	c50b2484-77c8-4b1b-8600-3be433a5ffc7	Assignment 01 Info Sec	N/A	\N	85	\N	\N	[]	completed	{"score": 85, "summary": "The student provided a clear and concise description of a phishing attack and identified the targeted layer as the Endpoint/User Layer. The suggested prevention mechanisms, Security Awareness Training and Multi-Factor Authentication, are effective and well-explained. However, the student could have provided more detail in the justification for the targeted layer.", "suggestions": ["Provide more detail in the justification for the targeted layer", "Consider including additional prevention mechanisms, such as firewalls or encryption"], "missed_points": ["Could have explained the impact of the attack in more detail", "Did not explicitly mention the type of cyberattack in the introduction"], "writing_clarity": 8}	2026-06-20 13:24:37.953531	handwritten	uploads\\57173188-9934-42a7-83b6-842ad7c0e058.pdf	8.5
beb6998a-d6e2-4edf-8322-7405b2ba9736	5	d958ec75-210e-4c4d-a84e-760b7ee0a405	Exploring Machine Learning in Everyday Life	N/A	\N	85	\N	\N	[]	completed	{"score": 85, "summary": "The submission provides a clear and concise introduction to Machine Learning, effectively distinguishing it from Artificial Intelligence and highlighting real-world applications. However, the explanations could be more detailed and supported with examples. The submission demonstrates a good understanding of the fundamentals, but lacks depth in certain areas.", "suggestions": ["Provide more detailed explanations of Machine Learning concepts", "Include additional real-world examples to illustrate the impact of Machine Learning", "Discuss potential limitations and challenges of implementing Machine Learning in various industries"], "readability_score": 8, "time_complexity": "N/A", "space_complexity": "N/A", "missed_edge_cases": ["The student could have explored the ethics of Machine Learning", "The submission does not discuss the potential risks of relying on Machine Learning in critical applications"]}	2026-06-19 21:31:44.70502	document	uploads\\6efd0e5f-8f81-4521-8aab-69189902b850.pdf	8.5
00c604bc-ee19-4fbe-aeac-02ca7a0c0c95	6	d958ec75-210e-4c4d-a84e-760b7ee0a405	Exploring Machine Learning in Everyday Life	N/A	\N	92	\N	\N	[]	completed	{"score": 92, "summary": "The submission provides a clear and comprehensive overview of Machine Learning, effectively distinguishing it from Artificial Intelligence and highlighting its real-world applications. The student demonstrates a strong understanding of the subject matter, and the writing is well-organized and easy to follow. However, there are some areas where the submission could be improved with more specific examples and technical details.", "suggestions": ["Provide more technical details about the machine learning algorithms used in the applications", "Include more specific examples of how Machine Learning is used in different industries", "Discuss the potential limitations and challenges of implementing Machine Learning in real-world scenarios"], "readability_score": 8, "time_complexity": "N/A", "space_complexity": "N/A", "missed_edge_cases": ["The student could have discussed the ethical implications of Machine Learning", "The submission does not address the potential risks of relying on Machine Learning for decision-making"]}	2026-06-19 21:34:25.807362	document	uploads\\46173696-0d85-4cfd-b55f-11df1e246730.pdf	9.2
04595221-8291-4df6-812c-2eb69eddaeac	4	c41fd44e-35f8-453b-9fa9-6e2ec8e184df	Predicting Student Scores Using Linear Regression	python	# Week 1 Coding Assignment: Predicting Student Scores Using Linear Regression\r\n\r\n## Task 1: Load and Prepare the Data\r\n\r\nimport pandas as pd\r\nimport matplotlib.pyplot as plt\r\nfrom sklearn.linear_model import LinearRegression\r\n\r\n# Create dataset\r\ndata = {\r\n    "Study Hours": [1, 2, 3, 4, 5, 6, 7, 8],\r\n    "Exam Score": [35, 40, 50, 55, 65, 70, 78, 85]\r\n}\r\n\r\ndf = pd.DataFrame(data)\r\n\r\n# Features and target\r\nX = df[["Study Hours"]]\r\ny = df["Exam Score"]\r\n\r\nprint(df)\r\n\r\n## Task 2: Train a Linear Regression Model\r\n\r\nmodel = LinearRegression()\r\nmodel.fit(X, y)\r\n\r\nprint("Model trained successfully!")\r\n\r\n## Task 3: Make Predictions\r\n\r\nprediction_1 = model.predict([[4.5]])\r\nprediction_2 = model.predict([[7.5]])\r\n\r\nprint(f"Predicted score for 4.5 study hours: {prediction_1[0]:.2f}")\r\nprint(f"Predicted score for 7.5 study hours: {prediction_2[0]:.2f}")\r\n\r\n## Task 4: Visualize the Results\r\n\r\nplt.scatter(X, y, label="Actual Data")\r\nplt.plot(X, model.predict(X), label="Regression Line")\r\n\r\nplt.xlabel("Study Hours")\r\nplt.ylabel("Exam Score")\r\nplt.title("Study Hours vs Exam Score")\r\nplt.legend()\r\n\r\nplt.show()\r\n\r\n## Task 5: Interpretation\r\n\r\n# The model learned a positive relationship between study hours and exam scores. The regression line indicates that students who spend more time studying generally achieve higher marks. Based on the predictions, a student studying 4.5 hours is expected to score approximately 60 marks, while a student studying 7.5 hours is expected to score approximately 83 marks. This demonstrates how Machine Learning can identify patterns in data and use them to make future predictions.	0	0	5	[{"test_case_id": 1, "verdict": "FAIL", "expected": "Predicted score for 4.5 study hours: 59.75\\nPredicted score for 7.5 study hours: 82.50", "actual": "", "error": "Unable to find image 'sandbox-python:latest' locally\\ndocker: Error response from daemon: pull access denied for sandbox-python, repository does not exist or may require 'docker login'\\n\\nRun 'docker run --help' for more information"}, {"test_case_id": 2, "verdict": "FAIL", "expected": "Predicted score for 4.5 study hours: 0.00\\nPredicted score for 7.5 study hours: 0.00", "actual": "", "error": "Unable to find image 'sandbox-python:latest' locally\\ndocker: Error response from daemon: pull access denied for sandbox-python, repository does not exist or may require 'docker login'\\n\\nRun 'docker run --help' for more information"}, {"test_case_id": 3, "verdict": "FAIL", "expected": "Predicted score for 4.5 study hours: 45.00\\nPredicted score for 7.5 study hours: 75.00", "actual": "", "error": "Unable to find image 'sandbox-python:latest' locally\\ndocker: Error response from daemon: pull access denied for sandbox-python, repository does not exist or may require 'docker login'\\n\\nRun 'docker run --help' for more information"}, {"test_case_id": 4, "verdict": "FAIL", "expected": "Predicted score for 4.5 study hours: 1.00\\nPredicted score for 7.5 study hours: 1.00", "actual": "", "error": "Unable to find image 'sandbox-python:latest' locally\\ndocker: Error response from daemon: pull access denied for sandbox-python, repository does not exist or may require 'docker login'\\n\\nRun 'docker run --help' for more information"}, {"test_case_id": 5, "verdict": "FAIL", "expected": "Predicted score for 4.5 study hours: -59.75\\nPredicted score for 7.5 study hours: -82.50", "actual": "", "error": "Unable to find image 'sandbox-python:latest' locally\\ndocker: Error response from daemon: pull access denied for sandbox-python, repository does not exist or may require 'docker login'\\n\\nRun 'docker run --help' for more information"}]	completed	{"time_complexity": "O(n) \\u2014 due to the linear regression model's training and prediction operations", "space_complexity": "O(n) \\u2014 because the dataset and model require memory proportional to the number of data points", "readability_score": 8, "suggestions": ["Consider adding error handling for potential issues with data loading or model training", "Use more descriptive variable names, such as 'study_hours_data' instead of 'X'", "Add comments to explain the purpose of each task and the logic behind the code"], "edge_cases_missed": ["Handling empty or missing data", "Dealing with non-numeric or non-integer values in the study hours or exam scores"], "overall_feedback": "The submission demonstrates a good understanding of linear regression and data visualization, but lacks robustness and error handling. The code is generally well-structured, but could benefit from more descriptive variable names and additional comments. With some improvements, this code could be more reliable and maintainable."}	2026-06-20 19:16:09.943585	code	\N	0
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, department, specialization, matric_number, created_at) FROM stdin;
2	Admin	admin@fyp.com	$2b$12$ngnNXKUcM3aoxW2cTa8wwutb37Oo2xLp14QyfSMz5FXpYtmBiCeHG	admin	\N	\N	\N	2026-06-19 20:29:15.272055
3	Zarnab Azam	zarnab.azam@uni.edu.pk	$2b$12$PWG.5b7/31.EcDFyQHwfmOZsV8LUZrVh0BamItLJEoEmmKf.sMdtm	teacher	Computer Science			2026-06-19 20:30:35.794954
4	Asad Ali Mir	f2022266039@uni.edu.pk	$2b$12$NnKOiPS28jOe8b6D9XViXOK6HgN4xgkW1fOQXIVIDdEMnQGmQavtu	student			STU001	2026-06-19 20:31:23.645006
5	Ali Haider	alihaider@uni.edu.pk	$2b$12$hRwIsQzqaJp4NBkBZrMx7ep58ckNur.qjcoBW0KO69OrK141z3GAC	student			STU002	2026-06-19 20:32:11.846632
6	Zainab Baig	zaini@uni.edu.pk	$2b$12$xUYXIIpikwU.9Nzl2jNqWuWvauSgum/IeGftjQt/C5KjZmqSFTqru	student			STU003	2026-06-19 20:33:48.007166
7	Dr.Jameel Ahmed	jameel.ahmed@uni.edu.pk	$2b$12$NgboCjHKSDxCXPHt.5L15OoFnWwzf/8ZgVoeKLGrBtaZ/F8oI5D4W	teacher	Computer Science			2026-06-20 13:01:49.972255
8	Asad Mir	f2022266039@umt.edu.pk	$2b$12$KlSuTc9JAxt1QHVcPy1E0.gkhwC/li7.sjwgwOzQEKI4F0lDQX2Za	student			STU004	2026-06-21 13:08:34.863938
9	Haider	f2022266010@umt.edu.pk	$2b$12$jPnCqqn0j2M1XWVC3.yU/O426cYsq.FC4UF6sEoIcsXeldfQib94S	student			STU005	2026-06-21 13:08:57.070969
\.


--
-- Data for Name: week_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.week_materials (id, week_id, type, name, url, created_at) FROM stdin;
1	2	file	Information Security Foundations.pdf	/uploads/32814196-dddc-46f5-8c6f-42abaea41f9b.pdf	2026-06-20 13:07:58.691696
2	2	file	Information Security Foundations 1.pdf	/uploads/f527ed45-2383-49a5-8a36-2eb9b697ba3e.pdf	2026-06-20 13:08:09.939239
\.


--
-- Data for Name: weeks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weeks (id, course_id, number, title, start_date, lessons) FROM stdin;
1	1	1	Introduction to Machine Learning	2026-06-20	[]
2	2	1	Foundations of Information Security	2026-06-20	[]
4	1	2	Your First Machine Learning Model	2026-06-20	[]
5	2	2	Network attacks	2026-06-21	[]
\.


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 2, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 20, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- Name: week_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.week_materials_id_seq', 2, true);


--
-- Name: weeks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.weeks_id_seq', 5, true);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: week_materials week_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.week_materials
    ADD CONSTRAINT week_materials_pkey PRIMARY KEY (id);


--
-- Name: weeks weeks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weeks
    ADD CONSTRAINT weeks_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict OuLvlMIntShSrJ7TwfNo2DlswKBfDV7KkSJzDAgfeMAHxfb8YawnfpDkWri4s5R


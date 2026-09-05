-- 1. ALTER TABLE to add the recommended columns if they don't exist
-- We don't recreate the table, just ensure it has the correct schema

DO $$
BEGIN
    -- Add columns if they don't exist
    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    EXCEPTION WHEN duplicate_column OR invalid_table_definition THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN scheme_name TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN category TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN description TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN eligibility TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN benefits TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN application_process TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN keywords TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN beneficiary_type TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN question TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN answer TEXT;
    EXCEPTION WHEN duplicate_column THEN
    END;

    BEGIN
        ALTER TABLE public.scheme_qa ADD COLUMN language TEXT DEFAULT 'en';
    EXCEPTION WHEN duplicate_column THEN
    END;
END $$;

-- 2. Ensure RLS allows anonymous reads (since the frontend / anon key needs to query it)
ALTER TABLE public.scheme_qa ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON public.scheme_qa;
    CREATE POLICY "Allow public read access" ON public.scheme_qa FOR SELECT USING (true);
EXCEPTION WHEN undefined_object THEN
END $$;


-- 3. Seed with some sample data
-- English sample
INSERT INTO public.scheme_qa (
    scheme_name, category, description, eligibility, benefits, application_process, 
    keywords, beneficiary_type, question, answer, language
) VALUES (
    'Pradhan Mantri Fasal Bima Yojana (PMFBY)', 
    'Agriculture', 
    'Crop insurance scheme to provide financial support to farmers suffering crop loss/damage arising out of unforeseen events.', 
    'All farmers including sharecroppers and tenant farmers growing notified crops in the notified areas are eligible for coverage.', 
    'Maximum 2% premium for Kharif crops, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops. The remaining premium is paid by the government.', 
    'Apply through the PMFBY portal, CSCs, or local banks with land records, Aadhaar, and bank passbook.', 
    'farmer, crop insurance, financial assistance, agriculture, pmfby', 
    'farmer', 
    'I need financial help for my crops / crop insurance.', 
    'You can apply for PMFBY (Pradhan Mantri Fasal Bima Yojana). It provides crop insurance with very low premiums (2% for Kharif, 1.5% for Rabi).', 
    'en'
);

-- Hindi sample
INSERT INTO public.scheme_qa (
    scheme_name, category, description, eligibility, benefits, application_process, 
    keywords, beneficiary_type, question, answer, language
) VALUES (
    'प्रधानमंत्री फसल बीमा योजना (PMFBY)', 
    'कृषि', 
    'प्राकृतिक आपदाओं, कीटों और बीमारियों के कारण फसल के नुकसान की स्थिति में किसानों को वित्तीय सहायता प्रदान करना।', 
    'अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाने वाले सभी किसान (बटाईदार और काश्तकार किसानों सहित) पात्र हैं।', 
    'खरीफ फसलों के लिए अधिकतम 2%, रबी के लिए 1.5% और वाणिज्यिक/बागवानी फसलों के लिए 5% प्रीमियम। शेष सरकार द्वारा भुगतान किया जाता है।', 
    'PMFBY पोर्टल, CSC या स्थानीय बैंकों के माध्यम से भूमि रिकॉर्ड, आधार और बैंक पासबुक के साथ आवेदन करें।', 
    'kisan, fasal, bima, arthik sahayata, pmfby, farmer', 
    'farmer', 
    'मुझे अपनी फसल के लिए आर्थिक सहायता या बीमा चाहिए।', 
    'आप प्रधानमंत्री फसल बीमा योजना (PMFBY) के लिए आवेदन कर सकते हैं। इसमें बहुत कम प्रीमियम पर फसल बीमा मिलता है।', 
    'hi'
);

-- Another English sample (PM-KISAN)
INSERT INTO public.scheme_qa (
    scheme_name, category, description, eligibility, benefits, application_process, 
    keywords, beneficiary_type, question, answer, language
) VALUES (
    'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)', 
    'Agriculture', 
    'Income support to all landholding farmers'' families in the country.', 
    'All landholding farmers'' families, which have cultivable landholding in their names are eligible.', 
    '₹6,000 per year in three equal installments of ₹2,000 each, directly into the bank accounts.', 
    'Register on the PM-KISAN portal or via Common Service Centres (CSCs) with Aadhaar and bank details.', 
    'farmer, income support, 6000, money, agriculture, pmkisan', 
    'farmer', 
    'Is there any scheme that gives direct money or income support to farmers?', 
    'Yes, PM-KISAN provides income support of ₹6,000 per year in three equal installments directly to landholding farmers.', 
    'en'
);

-- Another sample for a different domain (Students)
INSERT INTO public.scheme_qa (
    scheme_name, category, description, eligibility, benefits, application_process, 
    keywords, beneficiary_type, question, answer, language
) VALUES (
    'Post Matric Scholarship Scheme', 
    'Education', 
    'Financial assistance to students from minority communities for higher education.', 
    'Students from minority communities studying in class 11 to Ph.D. with minimum 50% marks in previous exam and family income below ₹2 Lakh.', 
    'Admission + tuition fee and maintenance allowance.', 
    'Apply online through the National Scholarship Portal (NSP).', 
    'student, scholarship, education, college, minority', 
    'student', 
    'Are there any government schemes for students or scholarships?', 
    'The Post Matric Scholarship Scheme provides financial assistance for admission, tuition, and maintenance for students from minority communities.', 
    'en'
);

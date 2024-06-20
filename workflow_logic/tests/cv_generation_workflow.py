job_desc = """
Our Purpose

We work to connect and power an inclusive, digital economy that benefits everyone, everywhere by making transactions safe, simple, smart and accessible. Using secure data and networks, partnerships and passion, our innovations and solutions help individuals, financial institutions, governments and businesses realize their greatest potential. Our decency quotient, or DQ, drives our culture and everything we do inside and outside of our company. We cultivate a culture of inclusion for all employees that respects their individual strengths, views, and experiences. We believe that our differences enable us to be a better team - one that makes better decisions, drives innovation and delivers better business results.

Title and Summary

Manager, Product Management

Join our dynamic team at Mastercard, where we're driving innovation and enhancing customer experiences in the digital realm. As part of our products team, you'll contribute to our mission of tokenizing every transaction, managing, and implementing scalable programs that enrich our tokenization, cryptography, and dynamic data offerings.  
  
As a Product Manager within the MDES Issuer Enablement and Customer Onboarding domains, you'll oversee the development and management of B2B customer onboarding, automation, self-service, and enterprise-level platforms and applications. Your role involves optimizing customer experience, enabling new functionality, transforming legacy services, and modernizing technology.  
  
About the Role:  

*   Develop and execute product strategies and roadmaps
*   Manage product development projects through the end-to-end lifecycle
*   Define product requirements based on customer and market inputs
*   Maintain existing products and services
*   Conduct market research and opportunity assessments
*   Analyze products/technology against customer needs and business requirements
*   Build collaboration with internal and external stakeholders
*   Coordinate with technical resources and global teams
*   Monitor product performance and manage vendor relationships
*   Prepare support materials and deliver training
*   Ensure compliance with company policies and governance
*   Provide guidance to team members

  
All About You:  

*   Proven understanding of the product development lifecycle and confidence with end-to-end product management (Ideation to launch) of B2B applications
*   Ability to lead large-scale technology projects
*   Detail-oriented with strong organizational and communication skills
*   Experience working with cross-functional and globally dispersed teams and vendors
*   Business acumen and ability to drive positive results
*   Proficiency in Confluence, Jira, AHA, Domo, Figma, or similar tools
*   Experience in Financial Services, Payments, Digital Commerce, Cloud, Big Data, Data Science/Analytics, or Microservices is a plus

In the US, Mastercard is an inclusive Equal Employment Opportunity employer that considers applicants without regard to gender, gender identity, sexual orientation, race, ethnicity, disabled or veteran status, or any other characteristic protected by law. If you require accommodations or assistance to complete the online application process, please contact reasonable\_accommodation@mastercard.com and identify the type of accommodation or assistance you are requesting. Do not include any medical or health information in this email. The Reasonable Accommodations team will respond to your email promptly.

Corporate Security Responsibility

  
All activities involving access to Mastercard assets, information, and networks comes with an inherent risk to the organization and, therefore, it is expected that every person working for, or on behalf of, Mastercard is responsible for information security and must:
*   Abide by Mastercard’s security policies and practices;
*   Ensure the confidentiality and integrity of the information being accessed;
*   Report any suspected information security violation or breach, and
*   Complete all periodic mandatory security trainings in accordance with Mastercard’s guidelines.
    

In line with Mastercard’s total compensation philosophy and assuming that the job will be performed in the US, the successful candidate will be offered a competitive base salary based on location, experience and other qualifications for the role and may be eligible for an annual bonus or commissions depending on the role. Mastercard benefits for full time (and certain part time) employees generally include: insurance (including medical, prescription drug, dental, vision, disability, life insurance), flexible spending account and health savings account, paid leaves (including 16 weeks new parent leave, up to 20 paid days bereavement leave), 10 annual paid sick days, 10 or more annual paid vacation days based on level, 5 personal days, 10 annual paid U.S. observed holidays, 401k with a best-in-class company match, deferred compensation for eligible roles, fitness reimbursement or on-site fitness facilities, eligibility for tuition reimbursement, gender-inclusive benefits and many more.

Pay Ranges

O'Fallon, Missouri: $119,000 - $190,000 USD"""

add_context = "I'm interested in a move to Missouri"

user_history = """Yung-Yu (Nicolas) Lin

43 Mirabelli Cir, San Jose, CA95134 • (323) 363-0671 • nicolas.y.lin@gmail.com

EXPERIENCE

PayPal - San Jose, CA 2019 - Present
Senior Product Manager, Merchant Product
- Led Data Science solutions to enhance product experience and marketing efficiency across Merchant lifecycle.
- Initiated and managed ML-based product recommendation and CV forecasting solutions, improving +10% of
product CTR and activation by leading a team of data scientists and data engineers.
- Initiated and led a real-time retargeting platform Boomerang with omnichannel communication capability, driving
+15% of incremental lift of conversions with 70% TTM reduction across user lifecycle.
- Fostered internal PM culture by organizing internal innovation events and PM committee.

Visa - Palo Alto, CA 2018 - 2019
Product Manager, Data
Developing data platforms and products as the critical foundation of the world’s largest digital payment network.
- Created and led product roadmap to deploy E2E data platforms from vendor evaluation and management to solution
deployment and migration with 100-PB scale operations.
- Managed and adopted both internal and external data assets of 20+ DP products.
- Launched Product Scorecard tool used by 500+ technical staffs to improve customer satisfaction and prioritize new
feature requests.

Facebook - Menlo Park, CA 2016 - 2018
Data Scientist, Infra Data Center Strategy
Drove impacts in efficiency optimization from ideation to execution by launching Data Center Operations Analytics program.
- Designed and deployed interactive visual products and analytical dashboards to evaluate operational risks and
facilitate exploratory researches, gaining 1M views in 6 months internally.
- Led the Datamart design and development with capacity of PB scale and 100+ users by leading data engineers.
- Built site optimization program for disaster recovery reliability by developing Machine Learning models across 8
global regions, reducing redundancy of 2 sites with 100+ millions saving.

Yahoo - Taipei, Taiwan 2011 - 2014
Senior Engineer & Technical Product Manager, E-Commerce Engineering Center
Developed and managed international software platforms and websites for 1 million users with $10B sales (NTD).
- Managed Cybersecurity products eliminating 95% of fraud and 97% of abuse cases by leading T&S Team.
- Initiated and launched Yahoo ServicePlus classified advertising marketplace which acquired 800k members and 1
million listing items by creating the vision and roadmap of the product and designing system architectures.

Sunplus Technology - Hsin-Chu, Taiwan 2006 - 2011
Advanced Engineer, Consumer Electronic Solutions
Led multi-locational teams to develop Integrated Circuit Solutions for Smart Home Devices with $10B+ in sales (NTD).

EDUCATION

University of Southern California, Marshall School of Business - Los Angeles, CA 2016
MBA with Concentration in Data Science and Operations

National Chiao-Tung University - Taiwan 2006
MS, Computer Science

National Central University - Taiwan 2004
BS, Mathematics

ADDITIONAL INFORMATION

Certificate: CSM, PMP, Software Product Management, Google Analytics
"""
if __name__ == "__main__":
    from workflow_logic.api import initialize_libraries
    from workflow_logic.util.utils import save_results_to_file
    task_library, model_manager_object, agent_library, template_library = None, None, None, None
    initialize_libraries()
    
    inputs = {
        "inputs_job_description": job_desc,
        "inputs_user_history": user_history,
        "inputs_additional_details": add_context,
        "inputs_request_cover_letter": True
    }
    code_task = task_library.get_task("cv_generation_workflow")
    result = code_task.execute(**inputs, step_through=False)

    if result:
        file_name = f"coding_task_results[CV_GENERATION].json"
        print(f'Saving results to file: {file_name}: Task: CV_Generation]')
        save_results_to_file(result.model_dump(), file_name)
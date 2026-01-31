import type { MessageSchema } from './types'

const en: MessageSchema = {
    services: {
        pageTitle: 'Solutions',
        pageSubtitle: 'Comprehensive cross-border solutions for Taiwanese entrepreneurs and high-net-worth families',
        corporate: {
            title: 'Corporate Services',
            intro: 'We provide full-cycle corporate administrative services in Singapore and Malaysia to help you launch your business quickly.',
            basic: {
                title: 'Basic Services',
                items: [
                    'Singapore/Malaysia Company Registration',
                    'Corporate Secretary Services',
                    'Annual Review & Filing',
                    'Amendment Services',
                    'Accounting & Bookkeeping'
                ]
            },
            banking: {
                title: 'Banking Assistance',
                priority: {
                    title: 'Priority Banking',
                    bank: 'Bank',
                    requirement: 'Minimum Deposit',
                    rows: [
                        { bank: 'OCBC Bank', requirement: 'S$350,000' },
                        { bank: 'UOB', requirement: 'S$350,000' },
                        { bank: 'DBS Bank', requirement: 'S$350,000' },
                        { bank: 'HSBC', requirement: 'S$350,000' },
                        { bank: 'Maybank', requirement: 'S$350,000' },
                        { bank: 'Citibank', requirement: 'S$280,000' },
                        { bank: 'CIMB Bank', requirement: 'S$250,000' },
                        { bank: 'Standard Chartered', requirement: 'US$200,000' }
                    ]
                },
                private: {
                    title: 'Private Banking',
                    top: 'Top Tier',
                    core: 'Core Tier',
                    select: 'Select Tier'
                }
            }
        },
        asset: {
            title: 'Asset Management & Real Estate',
            intro: 'Achieve wealth preservation, growth, and succession through diversified asset allocation tools.',
            financial: {
                title: 'Financial Asset Management',
                items: [
                    'Singapore Insurance Planning',
                    'VCC (Variable Capital Company) Fund Structuring',
                    'Family Trust Setup & Management',
                    'Family Office Operational Support'
                ]
            },
            realestate: {
                title: 'Real Estate Allocation',
                items: [
                    'Singapore: Premium commercial offices & private residential investment',
                    'Malaysia: Johor property opportunities (focus on rental yield & value preservation)'
                ]
            }
        },
        identity: {
            title: 'Identity & Talent Planning',
            intro: 'Plan legal and long-term residency for business owners, executives, and family members.',
            singapore: {
                title: 'Singapore Pathways',
                items: [
                    'Employment Pass (EP) Application & Renewal',
                    'Self-employed EP (Entrepreneur)',
                    'Equity Investment Immigration',
                    'Permanent Resident (PR) Application Planning',
                    'GIP Global Investor Programme',
                    'Family Office'
                ]
            },
            malaysia: {
                title: 'Malaysia Pathways',
                items: [
                    'Malaysia My Second Home (MM2H) Consultation & Application'
                ]
            }
        },
        education: {
            title: 'Education Planning',
            intro: 'Leveraging 28 years of professional experience, we provide comprehensive education solutions from kindergarten to university.',
            planning: {
                title: 'Study Abroad Planning',
                items: [
                    'Singapore government & international school application guidance',
                    'University admission counseling'
                ]
            },
            special: {
                title: 'Featured Services',
                desc: 'Full-service student apartments (providing accommodation, guardianship, and academic support in one stop, giving parents peace of mind)'
            }
        },
        brand: {
            title: 'Brand Transformation & Corporate Visits',
            intro: 'Empower corporate brand internationalization and provide in-depth industry site visits.',
            branding: {
                title: 'Brand Internationalization',
                items: [
                    'Build Singapore brand image',
                    'Establish Singapore global headquarters (HQ)',
                    'Trademark registration'
                ]
            },
            value: {
                title: 'Business Value-add',
                items: [
                    'Technology upgrade consulting',
                    'Jilin-Singapore Food Zone (IFSS standards) entry',
                    'E-commerce operations coaching',
                    'IPO support (Singapore/US)'
                ]
            },
            visit: {
                title: 'Corporate Visit Programs (Bookable)',
                medical: 'Healthcare Industry',
                medicalDesc: 'Listed medical device company (OEL), specialist/general clinics under listed companies',
                tech: 'Manufacturing & Technology',
                techDesc: '3D printing center, motorcycle manufacturing, AI smart robotic vertical farm (SUN POWER), WatchWater water treatment'
            }
        },
        tax: {
            title: 'Government Grants & Tax',
            intro: 'Maximize policy benefits and optimize corporate and personal tax costs.',
            grants: {
                title: 'Grant Applications',
                desc: 'Singapore and Malaysia government grant application consultation'
            },
            taxation: {
                title: 'Tax Services',
                items: [
                    'Corporate Tax filing',
                    'Personal Income Tax planning',
                    'International tax consultation',
                    'Charitable tax consultation'
                ]
            }
        },
        cta: {
            title: 'Learn More',
            subtitle: 'Contact our professional advisors for customized solutions',
            button: 'Book Consultation'
        }
    },
    industries: {
        pageTitle: 'Industry Solutions',
        pageSubtitle: 'Deep industry expertise providing precise market entry and growth strategies',
        items: [
            {
                id: 'food',
                title: 'Food & Wellness',
                titleEn: 'Food & Wellness',
                painPoint: 'Complex local compliance, time-consuming supply chain certification, and branding localization barriers.',
                solution: 'One-stop regulatory consulting, IFSS standard docking, and international brand upgrading.'
            },
            {
                id: 'pharma',
                title: 'Pharma & Healthcare',
                titleEn: 'Pharma & Healthcare',
                painPoint: 'High barriers for medical device registration, difficulty in talent matching, and clinical resource gaps.',
                solution: 'HSA registration assistance, OEL resource docking, and professional healthcare talent immigration planning.'
            },
            {
                id: 'fintech',
                title: 'FinTech',
                titleEn: 'FinTech',
                painPoint: 'Long license application process, strict MAS compliance, and capital market accessibility issues.',
                solution: 'Regulatory sandbox guidance, legal framework design, and capital market resource docking.'
            },
            {
                id: 'ecommerce',
                title: 'Cross-border E-commerce',
                titleEn: 'Cross-border E-commerce',
                painPoint: 'High tax costs, logistical inefficiencies, and fragmented ASEAN markets.',
                solution: 'Regional tax structure optimization, FTA benefit utilization, and Singapore HQ setup solutions.'
            },
            {
                id: 'familyoffice',
                title: 'Family Office & Asset Management',
                titleEn: 'Family Office & Asset Management',
                painPoint: 'Shifting tax exemption thresholds, unstable asset structures, and lack of succession mechanisms.',
                solution: '13O/13U tax incentive planning, VCC & Family Trust structuring, and long-term compliance support.'
            }
        ],
        labels: {
            painPoints: 'Common Pain Points',
            solutions: 'Our Solution'
        }
    },
    nav: {
        brand: 'TongHai Nanyang',
        home: 'Home',
        services: 'Services',
        industries: 'Industries',
        about: 'About',
        team: 'Team',
        news: 'News',
        contact: 'Contact',
        clientPortal: 'Login',
        staffPortal: 'Staff Portal',
        ctaButton: 'Enquire Now'
    },
    home: {
        hero: {
            title: 'Singapore Gateway: Expand with Confidence, Build a Legacy',
            subtitle: 'One-Stop Solution for Market Entry × Residency × Wealth Structuring × Asset Allocation',
            description: 'Comprehensive professional services for Chinese-speaking entrepreneurs and HNWIs seeking Singapore market access, residency, tax optimization, and asset allocation',
            btn1: 'Explore Services',
            btn2: 'Schedule a Discovery Call'
        },
        news: {
            title: 'Latest News',
            viewAll: 'View All',
            empty: 'No articles yet'
        },
        whatWeDo: {
            title: 'What We Do',
            learnMore: 'Learn More',
            service1: {
                title: 'Market Entry & Execution',
                desc: 'Incorporation/structuring, banking, licensing, government & industrial park liaison'
            },
            service2: {
                title: 'Residency & Talent Planning',
                desc: 'EP/PR pathways, family office support, education & relocation, executive mobility'
            },
            service3: {
                title: 'Wealth & Tax Structuring',
                desc: 'Treaty planning, VCC/trust/family office, CRS compliance, legacy solutions'
            },
            service4: {
                title: 'Real Estate & Allocation',
                desc: 'SG commercial/residential, Johor opportunities, portfolio allocation, leasing & preservation'
            }
        },
        howWeWork: {
            title: 'How We Work',
            step1: {
                title: 'Discovery',
                desc: 'Understand your goals, resources, and timeline'
            },
            step2: {
                title: 'Design',
                desc: 'Customized pathway and structure recommendations'
            },
            step3: {
                title: 'Execution',
                desc: 'Document prep, institutional liaison, full follow-through'
            },
            step4: {
                title: 'Support',
                desc: 'Compliance maintenance, policy updates, resource connection'
            }
        },
        whyUs: {
            title: 'Why Choose Us',
            reason1: {
                title: 'Deep Local Network',
                desc: 'Established partnerships with Singapore government and professional institutions'
            },
            reason2: {
                title: 'End-to-End Service',
                desc: 'From offshore planning to on-ground execution, one-stop solution'
            },
            reason3: {
                title: 'Professional Team',
                desc: 'Licensed accountants, lawyers, and immigration consultants'
            },
            reason4: {
                title: 'Native Communication',
                desc: 'Fluent in Chinese, understanding the real needs of Chinese entrepreneurs'
            }
        },
        cta: {
            title: 'Ready to Get Started?',
            subtitle: 'Book a complimentary discovery session to learn how to expand with confidence and build a legacy',
            button: 'Book Consultation'
        }
    },
    about: {
        pageTitle: 'About Us',
        pageSubtitle: 'Your "Second Cockpit" in Uncertain Times',
        brandStory: {
            title: 'Our Story',
            paragraph1: 'In today\'s era of global economic uncertainty, going global is not just about physical relocation—it\'s about elevating your strategic vision. <strong>TongHai Nanyang</strong>, headquartered in Singapore, serves both Singapore and Malaysia markets. We are more than your market entry partner—we are your <strong>"Second Cockpit"</strong> navigating through turbulent waters.',
            paragraph2: 'We bring together top experts in finance, law, education, and taxation, dedicated to providing Taiwanese entrepreneurs, multinational business owners, and high-net-worth families with integrated cross-border solutions covering business setup, identity planning, and asset structuring. We uphold <strong>compliance</strong> as our foundation and <strong>long-term partnership</strong> as our commitment, helping you expand with confidence and build a lasting legacy in Southeast Asia.'
        },
        coreValues: {
            title: 'Core Values',
            compliance: {
                title: 'Compliance First',
                desc: 'Strictly adhere to local laws and regulations, ensuring a robust and secure business structure'
            },
            goalOriented: {
                title: 'Goal-Oriented',
                desc: 'Tailor-made solutions for your unique business and succession needs'
            },
            transparency: {
                title: 'Transparent & Traceable',
                desc: 'Every decision is documented and traceable at key milestones'
            },
            longTerm: {
                title: 'Long-Term Partnership',
                desc: 'Committed to accompanying your business growth and family succession'
            }
        },
        coreTeam: {
            title: 'Core Team',
            intro: 'Our team comprises senior financial experts, lawyers, education consultants, and business strategists, providing you with comprehensive professional services.',
            members: {
                ada: {
                    name: 'Ada Huang',
                    position: 'Founder | CEO',
                    bio: 'Director at Finexis Advisory, 18 years of Singapore financial experience, CFP® Certified'
                },
                mars: {
                    name: 'Mars Yang',
                    position: 'Co-Founder',
                    bio: 'President of Singapore Cultural and Education Association, 28 years of international education experience'
                },
                wendy: {
                    name: 'Wendy Wei',
                    position: 'Taiwan Executive',
                    bio: 'Venture Capital CEO, 20 years of corporate consulting experience'
                }
            }
        },
        cta: {
            title: 'Meet Our Expert Team',
            subtitle: 'Schedule a meeting to learn how we can help grow your business',
            button: 'Book Consultation'
        }
    },
    team: {
        pageTitle: 'Our Team',
        pageSubtitle: 'Bringing together top experts in finance, law, education, and taxation to navigate your global expansion',
        categories: {
            founders: {
                title: 'FOUNDERS & EXECUTIVES',
                subtitle: 'Founders & Executives'
            },
            advisors: {
                title: 'INDUSTRY ADVISORS',
                subtitle: 'Industry Advisors (Legal, Finance, Logistics)'
            },
            consulting: {
                title: 'CONSULTING & WEALTH',
                subtitle: 'Business Consulting & Wealth Management Team'
            },
            regional: {
                title: 'REGIONAL HEADS',
                subtitle: 'Regional Representatives'
            }
        },
        members: {
            founders: {
                ada: {
                    name: 'Ada Huang',
                    position: 'TongHai Nanyang Founder | CEO',
                    tags: ['CFP®', 'WMI Family Office Advisor'],
                    bio: ['Director at Finexis Advisory, BNI Singapore Po Fung Chapter President (2022-2023)', '18 years in Singapore, specialized in one-stop financial solutions including insurance, funds, family trusts, VCC, and banking.']
                },
                mars: {
                    name: 'Mars Yang',
                    position: 'Co-Founder | Cross-border Business Executive',
                    tags: ['PhD in Mathematics, Beijing Academy of Social Sciences'],
                    bio: ['President of Singapore Cultural and Education Association (CEAS), Dean of Singapore Cultural and Education Institute', '28 years of international education experience. Responsible for market research, identity & education planning, and local operations.']
                },
                wendy: {
                    name: 'Wendy Wei',
                    position: 'Cross-border Business Executive (Taiwan)',
                    tags: ['Venture Capital CEO'],
                    bio: ['Over 20 years of corporate consulting experience, skilled in resource integration and sales.', 'Sharp market analysis capabilities, providing professional landing advice for Taiwanese entrepreneurs.']
                }
            },
            advisors: {
                thomas: {
                    name: 'Prof. Dr Thomas Sim',
                    position: 'FIATA President | CEO of OceanBlue Logistics',
                    desc: 'Chairman of Singapore Logistics Association, resource expert for World Bank and UNCTAD. Recipient of National Award from Singapore President.'
                },
                gavin: {
                    name: 'Gavin Liu',
                    position: 'Founder of Oriental Investment Holdings',
                    desc: 'Over 30 years of financial experience, specialized in investment and tech company IPOs. Focused on healthcare, AI economy, and RWA technology.'
                },
                linus: {
                    name: 'Linus Ng',
                    position: 'Barrister at Donaldson & Burkinshaw',
                    desc: 'Registered lawyer since 1998, focused on capital market financing, private equity, compliance consulting, and fintech legal services.'
                },
                ronald: {
                    name: 'Ronald Chu',
                    position: 'Founder of Ronald Chu Law Practice',
                    desc: 'Member of Global Family Office (GFO) Association. Provides GIP, PR applications, family office setup, and probate services.'
                }
            },
            consulting: {
                wendyLiu: {
                    name: 'Wendy Liu',
                    position: 'Business Development Director, Finnex Pte Ltd',
                    desc: '10 years of business consulting experience, partnered with over 60 banks. Specialized in corporate financing and market entry strategies.'
                },
                jevon: {
                    name: 'Jevon He',
                    position: 'Government Grants Consultant, Finnex Pte Ltd',
                    desc: '25 years of business experience, KAH license holder. Expert in government grants consulting and corporate transformation.'
                },
                martin: {
                    name: 'Martin Xu',
                    position: 'Senior Financial Planner (Finexis)',
                    desc: 'BSc from University of London. Years of experience in Singapore financial industry, providing wealth management services for HNW clients.'
                }
            },
            regional: {
                chenLi: {
                    name: 'Chen Li',
                    position: 'Sichuan Office Representative',
                    desc: 'Based in Chengdu, assisting Chinese entrepreneurs to explore Southeast Asian markets with end-to-end global expansion solutions.'
                },
                mayLee: {
                    name: 'May Lee',
                    position: 'Malaysia Representative',
                    desc: 'Chairman of Mr. Farmer Group, BNI Klang Senior Advisor. Expert in asset allocation, MM2H applications, and strategic planning.'
                },
                andy: {
                    name: 'Andy Chia',
                    position: 'Business Development Director, Jalin',
                    desc: '20 years of financial services experience (UOB, HSBC). Strong Singapore-Malaysia financial network, offering cross-border financial and property services.'
                }
            }
        },
        cta: {
            title: 'Consult Our Expert Team',
            subtitle: 'Click below to schedule an in-depth discovery session with our consultants',
            button: 'Book Expert Meeting'
        }
    },
    footer: {
        companyName: 'TongHai Nanyang',
        tagline: 'Expand with Confidence · Build a Legacy',
        quickLinks: 'Quick Links',
        contactInfo: 'Contact',
        disclaimer: 'Content on this website is for general information and client education only and does not constitute legal, tax, or investment advice. Recommendations are case-specific and subject to applicable laws and qualified/licensed professional advice.',
        copyright: '© 2026 TongHai Nanyang Consulting. All rights reserved.'
    },
    contact: {
        pageTitle: 'Contact Us',
        pageSubtitle: 'Let us understand your goals and provide professional solutions',
        form: {
            title: 'Consultation Form',
            subtitle: 'Please fill in the information below. Our consultants will contact you within 24 hours with an initial assessment.',
            name: 'Name',
            namePlaceholder: 'Enter your name',
            company: 'Company/Family Name',
            companyPlaceholder: 'Enter company or family name (optional)',
            services: {
                label: 'Services of Interest',
                corporate: 'Corporate & Banking',
                identity: 'Residency Planning (EP/PR/MM2H)',
                asset: 'Asset & Tax Structuring (VCC/Trust)',
                education: 'Education Planning',
                other: 'Other'
            },
            timeline: {
                label: 'Expected Timeline',
                '1month': 'Urgent (Within 1 month)',
                '3months': 'Within 3 months',
                '6months': 'Within 6 months',
                exploring: 'Just exploring'
            },
            contactMethod: {
                label: 'Contact Method',
                placeholder: 'Mobile / WeChat / WhatsApp / Email'
            },
            message: {
                label: 'Additional Information',
                placeholder: 'Tell us more about your needs...'
            },
            submit: 'Submit Inquiry',
            successMessage: 'Submitted successfully! We will contact you soon.',
            errorMessage: 'Submission failed. Please try again.',
            validation: {
                name: 'Please enter your name',
                contactMethod: 'Please provide contact information',
                services: 'Please select at least one service'
            }
        },
        info: {
            title: 'Contact Information',
            address: {
                title: 'Address',
                content: '20 Anson Road, Level 6, #06-66, Twenty Anson, Singapore 079912'
            },
            email: {
                title: 'Email'
            },
            hours: {
                title: 'Working Hours',
                content: 'Mon - Fri, 9:00 AM - 6:00 PM (SGT)'
            }
        },
        why: {
            title: 'Why Choose Us?',
            items: [
                'Professional Licensed Consultants',
                'One-Stop Comprehensive Service',
                'Transparent & Compliant',
                'Long-Term Commitment'
            ]
        }
    },
    chat: {
        title: 'AI Assistant',
        open: 'Open Chat',
        close: 'Close Chat',
        online: 'Online',
        welcome: 'Hello! I\'m the TongHai Nanyang AI assistant. How can I help you today?',
        inputPlaceholder: 'Type your question...',
        errorMessage: 'Sorry, something went wrong. Please try again later.',
        helpful: 'Helpful',
        notHelpful: 'Not Helpful',
        relatedQuestions: 'Related questions:',
        contactHuman: 'Contact a real consultant',
        quickActions: {
            services: 'What services do you offer?',
            ep: 'How to apply for Singapore EP?',
            company: 'Requirements for Singapore company registration?',
            contact: 'How to book a consultation?'
        }
    },

    news: {
        title: 'News & Insights',
        subtitle: 'Stay updated with industry trends and business opportunities',
        all: 'All',
        company: 'Company News',
        industry: 'Industry News',
        top: 'Featured',
        popular: 'Popular Articles',
        empty: 'No articles found',
        views: 'views',
        source: 'Original Source',
        share: 'Share',
        linkCopied: 'Link copied!',
        backToList: 'Back to List',
        notFound: 'Article not found',
        needHelp: 'Need Professional Advice?',
        helpDesc: 'Our consultant team is ready to provide one-on-one service',
        contactUs: 'Contact Us'
    }
}

export default en

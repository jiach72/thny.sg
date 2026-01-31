import type { MessageSchema } from './types'

const zhCN: MessageSchema = {
    services: {
        pageTitle: '服务方案',
        pageSubtitle: '为台湾企业家与高净值家族提供全方位跨境解决方案',
        corporate: {
            title: '企业出海与落地',
            intro: '我们在新加坡与马来西亚提供全周期的企业行政服务，助您快速启动业务。',
            basic: {
                title: '基础服务',
                items: [
                    '新马公司注册',
                    '法定秘书服务',
                    '年审年报',
                    '变更服务',
                    '会计记账'
                ]
            },
            banking: {
                title: '银行开户协助',
                priority: {
                    title: '零售高级账户 (Priority Banking)',
                    bank: '银行',
                    requirement: '最低存款要求',
                    rows: [
                        { bank: 'OCBC 华侨银行', requirement: 'S$350,000' },
                        { bank: 'UOB 大华银行', requirement: 'S$350,000' },
                        { bank: 'DBS 星展银行', requirement: 'S$350,000' },
                        { bank: 'HSBC 汇丰银行', requirement: 'S$350,000' },
                        { bank: 'Maybank 马来亚银行', requirement: 'S$350,000' },
                        { bank: 'Citibank 花旗银行', requirement: 'S$280,000' },
                        { bank: 'CIMB 联昌银行', requirement: 'S$250,000' },
                        { bank: 'Standard Chartered 渣打银行', requirement: 'US$200,000' }
                    ]
                },
                private: {
                    title: '私人银行账户 (Private Banking)',
                    top: '顶级梯队',
                    core: '核心梯队',
                    select: '精选梯队'
                }
            }
        },
        asset: {
            title: '资产管理与房产',
            intro: '通过多元化的资产配置工具，实现财富的保值、增值与传承。',
            financial: {
                title: '金融资产管理',
                items: [
                    '新加坡保险配置',
                    'VCC (Variable Capital Company) 基金架构搭建',
                    '家族信托 (Family Trust) 设立与管理',
                    '家族办公室 (Family Office) 运营支持'
                ]
            },
            realestate: {
                title: '不动产配置',
                items: [
                    '新加坡：优质商办写字楼、私人住宅投资建议',
                    '马来西亚：柔佛区域房产机遇（关注长租收益与保值增值）'
                ]
            }
        },
        identity: {
            title: '身份与人才规划',
            intro: '为企业主、高管及家庭成员规划合法、长期的居留身份。',
            singapore: {
                title: '新加坡路径',
                items: [
                    '就业准证 (EP) 申请与续签',
                    '自雇创业移民 (Self-employed EP)',
                    '股权投资移民',
                    '永久居民 (PR) 申请规划',
                    'GIP 全球投资者计划',
                    '家族办公室'
                ]
            },
            malaysia: {
                title: '马来西亚路径',
                items: [
                    '第二家园计划 (MM2H) 咨询与代办'
                ]
            }
        },
        education: {
            title: '教育留学规划',
            intro: '依托28年专业经验，为下一代提供从幼儿园到大学的全龄段教育解决方案。',
            planning: {
                title: '留学规划',
                items: [
                    '新加坡政府学校、国际学校申请指导',
                    '大学升学指导'
                ]
            },
            special: {
                title: '特色服务',
                desc: '全托管式学生公寓（提供住宿、监护、学业辅导一站式服务,解决家长后顾之忧）'
            }
        },
        brand: {
            title: '品牌转型与企业考察',
            intro: '助力企业品牌国际化，并提供深入行业的实地考察机会。',
            branding: {
                title: '品牌出海',
                items: [
                    '打造新加坡品牌形象',
                    '设立新加坡全球总部 (HQ)',
                    '商标注册'
                ]
            },
            value: {
                title: '商业增值',
                items: [
                    '技术提升咨询',
                    '入驻吉林中新食品区 (IFSS标准)',
                    '电商运营辅导',
                    '陪跑新/美上市'
                ]
            },
            visit: {
                title: '企业考察项目（可预约）',
                medical: '医疗行业',
                medicalDesc: '上市医疗器械公司 (OEL)、上市公司旗下专科/全科诊所',
                tech: '制造与科技',
                techDesc: '3D打印中心、摩托车制造厂、AI智能机器人植物工厂 (SUN POWER)、WatchWater 水处理企业'
            }
        },
        tax: {
            title: '政府津贴与税务',
            intro: '最大化利用政策红利，优化企业与个人税务成本。',
            grants: {
                title: '津贴申请',
                desc: '新加坡与马来西亚企业政府津贴 (Government Grants) 申请咨询'
            },
            taxation: {
                title: '税务服务',
                items: [
                    '企业税 (Corporate Tax) 申报',
                    '个人所得税 (Personal Income Tax) 规划',
                    '国际税务咨询',
                    '慈善事业税务咨询'
                ]
            }
        },
        cta: {
            title: '了解更多详情',
            subtitle: '联络我们的专业顾问,获取定制化解决方案',
            button: '预约咨询'
        }
    },
    industries: {
        pageTitle: '产业解决方案',
        pageSubtitle: '深耕行业特性，提供精准的出海与落地策略',
        items: [
            {
                id: 'food',
                title: '食品与保健品',
                titleEn: 'Food & Wellness',
                painPoint: '在地法规准入复杂、供应链认证耗时、品牌在地化困难。',
                solution: '提供一站式合规咨询、对接吉林中新食品区 (IFSS) 标准、协助品牌国际化升级。'
            },
            {
                id: 'pharma',
                title: '医药与医疗',
                titleEn: 'Pharma & Healthcare',
                painPoint: '医疗器械注册门槛高、专业人才匹配难、临床资源对接不畅。',
                solution: '协助 HSA 注册、对接上市医疗器械公司 (OEL) 资源、规划高端医疗人才引引路径。'
            },
            {
                id: 'fintech',
                title: '金融科技',
                titleEn: 'FinTech',
                painPoint: '牌照申请流程冗长、金管局 (MAS) 合规要求高、资本市场对接困难。',
                solution: '提供监管沙盒申请指导、法律架构设计、对接东方投融等资本市场资源。'
            },
            {
                id: 'ecommerce',
                title: '跨境电商',
                titleEn: 'Cross-border E-commerce',
                painPoint: '税务成本高企、物流效率待提升、东南亚多国市场碎片化。',
                solution: '优化区域税务架构、利用自贸协定 (FTA) 红利、提供新加坡总部 (HQ) 设立方案。'
            },
            {
                id: 'familyoffice',
                title: '家族办公室与资产管理',
                titleEn: 'Family Office & Asset Management',
                painPoint: '税务豁免门槛变动、资产架构不稳健、财富传承机制缺失。',
                solution: '规划 13O/13U 税务激励申请、设计 VCC 与家族信托结构、提供长期合规陪跑。'
            }
        ],
        labels: {
            painPoints: '常见痛点',
            solutions: '我们的解决方式'
        }
    },
    nav: {
        brand: '通海南洋',
        home: '首页',
        services: '服务方案',
        industries: '产业解决方案',
        about: '关于我们',
        team: '团队',
        news: '新闻动态',
        contact: '联络我们',
        clientPortal: '登录',
        staffPortal: '员工入口',
        ctaButton: '立即咨询' // force update
    },
    home: {
        hero: {
            title: '新加坡 出海无忧 传承有道',
            subtitle: '一站式企业落地 × 身份规划 × 财富架构 × 资产配置',
            description: '为华语企业家与高净值家庭提供新加坡市场准入、身份取得、税务优化、资产配置的全方位专业服务',
            btn1: '探索服务方案',
            btn2: '安排第一次诊断会'
        },
        news: {
            title: '新闻动态',
            viewAll: '查看全部',
            empty: '暂无新闻'
        },
        whatWeDo: {
            title: '我们提供什么',
            learnMore: '了解更多',
            service1: {
                title: '企业出海与落地',
                desc: '注册/架构、银行开户、准入许可、园区与招商对接'
            },
            service2: {
                title: '身份与人才规划',
                desc: 'EP/PR路径、家族办公室配套、子女教育与安顿、人才引进'
            },
            service3: {
                title: '财富与税务架构',
                desc: '税务协定/优化、VCC/信托/家办、CRS合规、传承工具'
            },
            service4: {
                title: '房地产与资产配置',
                desc: '新加坡商办/住宅、柔佛机遇、资产组合配置、长租与保值增值'
            }
        },
        howWeWork: {
            title: '我们如何工作',
            step1: {
                title: '初步诊断',
                desc: '了解您的目标、资源与时间表'
            },
            step2: {
                title: '方案设计',
                desc: '定制化路径与架构建议'
            },
            step3: {
                title: '执行落地',
                desc: '文件准备、对接机构、全程跟进'
            },
            step4: {
                title: '持续支持',
                desc: '合规维护、政策更新、资源对接'
            },
        },
        whyUs: {
            title: '为什么选择我们',
            reason1: {
                title: '深度在地网络',
                desc: '与新加坡政府部门、专业机构建立长期合作'
            },
            reason2: {
                title: '全流程服务',
                desc: '从出海规划到落地执行,一站式解决方案'
            },
            reason3: {
                title: '专业团队',
                desc: '持牌会计师、律师、移民顾问组成的复合团队'
            },
            reason4: {
                title: '华语服务',
                desc: '母语沟通,理解华人企业家的真实需求'
            }
        },
        cta: {
            title: '准备好开始了吗?',
            subtitle: '预约免费诊断会议,了解如何稳健出海、传承未来',
            button: '预约咨询'
        }
    },
    about: {
        pageTitle: '关于我们',
        pageSubtitle: '企业主在不确定时代里的"第二驾驶舱"',
        brandStory: {
            title: '品牌故事',
            paragraph1: '在全球经济充满不确定性的当下，企业出海不仅仅是物理空间的转移，更是战略视野的升级。<strong>通海南洋 (TongHai Nanyang)</strong> 总部位于新加坡，深耕新马双市场。我们不仅仅是您的出海服务商，更是企业主在风浪中的<strong>"第二驾驶舱"</strong>。',
            paragraph2: '我们汇聚了金融、法律、教育与税务领域的顶尖专家，致力于为台湾企业家、跨国企业主及高净值家族提供「企业落地 + 身份规划 + 资产架构」的一站式跨境解决方案。我们坚持<strong>合规优先</strong>，以<strong>长期陪跑</strong>为承诺，助您在南洋这片热土上，稳健出海，传承未来。'
        },
        coreValues: {
            title: '核心价值观',
            compliance: {
                title: '合规优先',
                desc: '严格遵循当地法律法规，确保业务架构稳健安全'
            },
            goalOriented: {
                title: '以终为始',
                desc: '量身定制最适合的落地与传承方案'
            },
            transparency: {
                title: '透明可追溯',
                desc: '关键节点可追溯，每一次决策都有据可依'
            },
            longTerm: {
                title: '长期陪跑',
                desc: '长期陪伴企业成长与家族传承'
            }
        },
        coreTeam: {
            title: '核心团队',
            intro: '我们的团队由资深金融专家、律师、教育顾问和商业策略师组成，为您提供全方位专业服务。',
            members: {
                ada: {
                    name: 'Ada 黄芊惠',
                    position: '创始人 | CEO',
                    bio: 'Finexis Advisory 总监，18年新加坡金融经验，CFP® 认证顾问'
                },
                mars: {
                    name: 'Mars 杨栋',
                    position: '联合创始人',
                    bio: '新加坡文化与教育协会会长，28年国际教育经验'
                },
                wendy: {
                    name: 'Wendy 魏文帝',
                    position: '台湾执行官',
                    bio: '创投公司 CEO，20年企业顾问经验'
                }
            }
        },
        cta: {
            title: '与我们的专家团队见面',
            subtitle: '预约会议，了解我们如何协助您的业务成长',
            button: '预约咨询'
        }
    },
    team: {
        pageTitle: '我们的团队',
        pageSubtitle: '汇聚金融、法律、教育与税务领域的顶尖专家，为您的出海之路保驾护航',
        categories: {
            founders: {
                title: 'FOUNDERS & EXECUTIVES',
                subtitle: '创始人与高管层'
            },
            advisors: {
                title: 'INDUSTRY ADVISORS',
                subtitle: '行业专家顾问（法律、金融、物流）'
            },
            consulting: {
                title: 'CONSULTING & WEALTH',
                subtitle: '商业咨询与理财团队'
            },
            regional: {
                title: 'REGIONAL HEADS',
                subtitle: '区域负责人'
            }
        },
        members: {
            founders: {
                ada: {
                    name: 'Ada 黄芊惠',
                    position: '通海南洋创始人 | CEO',
                    tags: ['CFP®', 'WMI 家办顾问'],
                    bio: ['Finexis Advisory 总监, BNI 新加坡宝丰分会主席 (2022-2023)', '留学移民新加坡18年，专注一站式金融解决方案，包括保险、基金、家族信托、VCC 及银行开户等。']
                },
                mars: {
                    name: 'Mars 杨栋',
                    position: '联合创始人 | 跨境商业落地执行官',
                    tags: ['北京社科院数学博士'],
                    bio: ['新加坡文化与教育协会会长 (CEAS), 新加坡文化与教育学院院长', '拥有28年国际教育经验。负责市场考察与落地、身份与教育规划及本地化运营。']
                },
                wendy: {
                    name: 'Wendy 魏文帝',
                    position: '跨境商业落地执行官（台湾）',
                    tags: ['创投公司 CEO'],
                    bio: ['拥有超过20年企业顾问经验, 擅长资源整合与销售。', '具备敏锐的市场分析能力, 为台湾企业家提供专业落地建议。']
                }
            },
            advisors: {
                thomas: {
                    name: 'Prof. Dr Thomas Sim',
                    position: 'FIATA 主席 | 海联集团 CEO',
                    desc: '新加坡物流学院主席, 世界银行、联合国贸发会议资源专家。获新加坡总统颁发国家奖项。'
                },
                gavin: {
                    name: 'Gavin 柳达礼',
                    position: '东方投融金控集团创始人',
                    desc: '30多年金融经验, 擅长投资及操盘科技企业上市。专注于大健康、AI 经济及 RWA 技术。'
                },
                linus: {
                    name: 'Linus 伍修宏',
                    position: '敦升律师事务所大律师',
                    desc: '1998年注册律师, 专注资本市场融资、私募基金、合规咨询及金融科技法律服务。'
                },
                ronald: {
                    name: 'Ronald 朱国祯',
                    position: '朱国祯律师事务所创始人',
                    desc: '全球家办 (GFO) 协会会员。提供 GIP、PR 申请、家办设立及遗嘱认证服务。'
                }
            },
            consulting: {
                wendyLiu: {
                    name: 'Wendy 刘泳岐',
                    position: 'Finnex Pte Ltd 业务发展总监',
                    desc: '10年商业顾问经验, 与超过60间银行合作。擅长企业融资与市场进军策略。'
                },
                jevon: {
                    name: 'Jevon 何建洛',
                    position: 'Finnex Pte Ltd 政府津贴顾问',
                    desc: '25年经商经验, KAH 执照持有人。专精政府津贴咨询、企业策略转型。'
                },
                martin: {
                    name: 'Martin 许岩',
                    position: '资深理财规划师 (Finexis)',
                    desc: '英国伦敦大学学士。深耕新加坡金融业多年, 为高净值客户提供财富管理服务。'
                }
            },
            regional: {
                chenLi: {
                    name: '陈利',
                    position: '四川办事处负责人',
                    desc: '常驻成都, 协助中国企业家开拓东南亚市场, 提供全链路出海解决方案。'
                },
                mayLee: {
                    name: 'May Lee',
                    position: '马来西亚负责人',
                    desc: '农先生集团董事长, BNI 巴生资深顾问。专精资产配置、MM2H 申请及战略规划。'
                },
                andy: {
                    name: 'Andy Chia 谢汉亮',
                    position: 'Jalin 家宁 业务发展总监',
                    desc: '20年金融服务经验 (UOB, HSBC)。深厚新马金融网络, 提供跨境金融及房产服务。'
                }
            }
        },
        cta: {
            title: '咨询我们的专家团队',
            subtitle: '点击下方按钮，与我们的顾问安排一次深入的诊断会',
            button: '预约专家会议'
        }
    },
    footer: {
        companyName: '通海南洋',
        tagline: '稳健出海 · 传承未来',
        quickLinks: '快速链接',
        contactInfo: '联络资讯',
        disclaimer: '本网站内容仅供一般资讯与客户教育之用,不构成法律、税务或投资建议。具体方案需依个案背景与当地法规评估,并由持牌/合资格专业人士提供意见。',
        copyright: '© 2026 通海南洋咨询有限公司 版权所有'
    },
    contact: {
        pageTitle: '联络我们',
        pageSubtitle: '让我们了解您的目标，提供专业的解决方案',
        form: {
            title: '填写咨询表单',
            subtitle: '请填写以下信息，我们的顾问将在24小时内与您联系，提供初步评估方案。',
            name: '姓名',
            namePlaceholder: '请输入您的姓名',
            company: '公司/家族名称',
            companyPlaceholder: '请输入公司或家族名称（选填）',
            services: {
                label: '您感兴趣的服务',
                corporate: '企业出海与银行开户',
                identity: '身份规划 (EP/PR/MM2H)',
                asset: '资产与税务架构 (VCC/信托)',
                education: '教育留学规划',
                other: '其他'
            },
            timeline: {
                label: '预计启动时间',
                '1month': '1个月内急需',
                '3months': '3个月内',
                '6months': '半年内规划',
                exploring: '仅先了解/观望'
            },
            contactMethod: {
                label: '联系方式',
                placeholder: '手机/微信/WhatsApp/Email'
            },
            message: {
                label: '补充说明',
                placeholder: '请告诉我们更多关于您的需求...'
            },
            submit: '送出咨询',
            successMessage: '提交成功！我们会尽快与您联系。',
            errorMessage: '提交失败，请重试。',
            validation: {
                name: '请输入您的姓名',
                contactMethod: '请提供联系方式',
                services: '请至少选择一项服务'
            }
        },
        info: {
            title: '联络信息',
            address: {
                title: '地址',
                content: '20 Anson Road, Level 6, #06-66, Twenty Anson, Singapore 079912'
            },
            email: {
                title: 'Email'
            },
            hours: {
                title: '工作时间',
                content: 'Mon - Fri, 9:00 AM - 6:00 PM (SGT)'
            }
        },
        why: {
            title: '为什么选择我们？',
            items: [
                '专业团队，持牌顾问',
                '全方位一站式服务',
                '透明合规，可追溯',
                '长期陪跑，承诺服务'
            ]
        }
    },
    chat: {
        title: '智能助手',
        open: '打开聊天',
        close: '关闭聊天',
        online: '在线',
        welcome: '您好！我是通海南洋的智能助手，有什么可以帮助您的吗？',
        inputPlaceholder: '输入您的问题...',
        errorMessage: '抱歉，系统出现问题，请稍后再试。',
        helpful: '有帮助',
        notHelpful: '没帮助',
        relatedQuestions: '相关问题：',
        contactHuman: '联系真人顾问',
        quickActions: {
            services: '你们提供哪些服务？',
            ep: '如何申请新加坡EP？',
            company: '新加坡公司注册条件？',
            contact: '如何预约咨询？'
        }
    },

    news: {
        title: '新闻资讯',
        subtitle: '掌握行业动态，把握商机脉搏',
        all: '全部',
        company: '公司动态',
        industry: '行业新闻',
        top: '置顶',
        popular: '热门文章',
        empty: '暂无新闻',
        views: '浏览',
        source: '原文链接',
        share: '分享',
        linkCopied: '链接已复制',
        backToList: '返回列表',
        notFound: '文章不存在',
        needHelp: '需要专业咨询？',
        helpDesc: '我们的顾问团队随时为您提供一对一服务',
        contactUs: '联系我们'
    }
}

export default zhCN

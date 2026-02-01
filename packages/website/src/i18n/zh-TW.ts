import type { MessageSchema } from './types'

const zhTW: MessageSchema = {
    services: {
        pageTitle: '服務方案',
        pageSubtitle: '為台湾企業家與高淨值家族提供全方位跨境解決方案',
        corporate: {
            title: '企業出海與落地',
            intro: '我們在新加坡與馬來西亞提供全週期的企業行政服務，助您快速啟動業務。',
            basic: {
                title: '基礎服務',
                items: [
                    '新马公司註冊',
                    '法定秘書服務',
                    '年審年報',
                    '變更服務',
                    '會計記賬'
                ]
            },
            banking: {
                title: '銀行開戶協助',
                priority: {
                    title: '零售高級賬戶 (Priority Banking)',
                    bank: '銀行',
                    requirement: '最低存款要求',
                    rows: [
                        { bank: 'OCBC 華僑銀行', requirement: 'S$350,000' },
                        { bank: 'UOB 大華銀行', requirement: 'S$350,000' },
                        { bank: 'DBS 星展銀行', requirement: 'S$350,000' },
                        { bank: 'HSBC 匯豐銀行', requirement: 'S$350,000' },
                        { bank: 'Maybank 馬來亞銀行', requirement: 'S$350,000' },
                        { bank: 'Citibank 花旗銀行', requirement: 'S$280,000' },
                        { bank: 'CIMB 聯昌銀行', requirement: 'S$250,000' },
                        { bank: 'Standard Chartered 渣打銀行', requirement: 'US$200,000' }
                    ]
                },
                private: {
                    title: '私人銀行賬戶 (Private Banking)',
                    top: '頂級梯隊',
                    core: '核心梯隊',
                    select: '精選梯隊'
                }
            }
        },
        asset: {
            title: '資產管理與房產',
            intro: '通過多元化的資產配置工具，實現財富的保值、增值與傳承。',
            financial: {
                title: '金融資產管理',
                items: [
                    '新加坡保險配置',
                    'VCC (Variable Capital Company) 基金架構搭建',
                    '家族信託 (Family Trust) 設立與管理',
                    '家族辦公室 (Family Office) 運營支持'
                ]
            },
            realestate: {
                title: '不動產配置',
                items: [
                    '新加坡：優質商辦寫字樓、私人住宅投資建議',
                    '馬來西亞：柔佛區域房產機遇（關注長租收益與保值增值）'
                ]
            }
        },
        identity: {
            title: '身份與人才規劃',
            intro: '為企業主、高管及家庭成員規劃合法、長期的居留身份。',
            singapore: {
                title: '新加坡路徑',
                items: [
                    '就業准證 (EP) 申請與續簽',
                    '自雇創業移民 (Self-employed EP)',
                    '股權投資移民',
                    '永久居民 (PR) 申請規劃',
                    'GIP 全球投資者計劃',
                    '家族辦公室'
                ]
            },
            malaysia: {
                title: '馬來西亞路徑',
                items: [
                    '第二家園計劃 (MM2H) 諮詢與代辦'
                ]
            }
        },
        education: {
            title: '教育留學規劃',
            intro: '依托28年專業經驗，為下一代提供從幼兒園到大學的全齡段教育解決方案。',
            planning: {
                title: '留學規劃',
                items: [
                    '新加坡政府學校、國際學校申請指導',
                    '大學升學指導'
                ]
            },
            special: {
                title: '特色服務',
                desc: '全托管式學生公寓（提供住宿、監護、學業輔導一站式服務,解決家長後顧之憂）'
            }
        },
        brand: {
            title: '品牌轉型與企業考察',
            intro: '助力企業品牌國際化，並提供深入行業的實地考察機會。',
            branding: {
                title: '品牌出海',
                items: [
                    '打造新加坡品牌形象',
                    '設立新加坡全球總部 (HQ)',
                    '商標註冊'
                ]
            },
            value: {
                title: '商業增值',
                items: [
                    '技術提升諮詢',
                    '入駐吉林中新食品區 (IFSS標準)',
                    '電商運營輔導',
                    '陪跑新/美上市'
                ]
            },
            visit: {
                title: '企業考察項目（可預約）',
                medical: '醫療行業',
                medicalDesc: '上市醫療器械公司 (OEL)、上市公司旗下專科/全科診所',
                tech: '製造與科技',
                techDesc: '3D打印中心、摩托車製造廠、AI智能機器人植物工廠 (SUN POWER)、WatchWater 水處理企業'
            }
        },
        tax: {
            title: '政府津貼與稅務',
            intro: '最大化利用政策紅利，優化企業與個人稅務成本。',
            grants: {
                title: '津貼申請',
                desc: '新加坡與馬來西亞企業政府津貼 (Government Grants) 申請諮詢'
            },
            taxation: {
                title: '稅務服務',
                items: [
                    '企業稅 (Corporate Tax) 申報',
                    '個人所得稅 (Personal Income Tax) 規劃',
                    '國際稅務諮詢',
                    '慈善事業稅務諮詢'
                ]
            }
        },
        cta: {
            title: '了解更多詳情',
            subtitle: '聯絡我們的專業顧問,獲取定制化解決方案',
            button: '預約諮詢'
        }
    },
    industries: {
        pageTitle: '產業解決方案',
        pageSubtitle: '深耕行業特性，提供精準的出海與落地策略',
        items: [
            {
                id: 'food',
                title: '食品與保健品',
                titleEn: 'Food & Wellness',
                painPoint: '在地法規准入複雜、供應鏈認證耗時、品牌在地化困難。',
                solution: '提供一站式合規諮詢、對接吉林中新食品區 (IFSS) 標準、協助品牌國際化升級。'
            },
            {
                id: 'pharma',
                title: '醫藥與醫療',
                titleEn: 'Pharma & Healthcare',
                painPoint: '醫療器械註冊門檻高、專業人才匹配難、臨床資源對接不暢。',
                solution: '協助 HSA 註冊、對接上市醫療器械公司 (OEL) 資源、規劃高端醫療人才引引路徑。'
            },
            {
                id: 'fintech',
                title: '金融科技',
                titleEn: 'FinTech',
                painPoint: '牌照申請流程冗長、金管局 (MAS) 合規要求高、資本市場對接困難。',
                solution: '提供監管沙盒申請指導、法律架構設計、對接東方投融等資本市場資源。'
            },
            {
                id: 'ecommerce',
                title: '跨境電商',
                titleEn: 'Cross-border E-commerce',
                painPoint: '稅務成本高企、物流效率待提升、東南亞多國市場碎片化。',
                solution: '優化區域稅務架構、利用自貿協定 (FTA) 紅利、提供新加坡總部 (HQ) 設立方案。'
            },
            {
                id: 'familyoffice',
                title: '家族辦公室與資產管理',
                titleEn: 'Family Office & Asset Management',
                painPoint: '稅務豁免門檻變動、資產架構不穩健、財富傳承機制缺失。',
                solution: '規劃 13O/13U 稅務激勵申請、設計 VCC 與家族信託結構、提供長期合規陪跑。'
            }
        ],
        labels: {
            painPoints: '常見痛點',
            solutions: '我們的解決方式'
        }
    },
    nav: {
        brand: '通海南洋',
        home: '首頁',
        services: '服務方案',
        industries: '產業解決方案',
        about: '關於我們',
        team: '團隊',
        news: '新聞動態',
        contact: '聯絡我們',
        clientPortal: '登錄',
        staffPortal: '員工入口',
        ctaButton: '立即諮詢'
    },
    home: {
        hero: {
            title: '新加坡 出海無憂 傳承有道',
            subtitle: '一站式企業落地 × 身分規劃 × 財富架構 × 資產配置',
            description: '為華語企業家與高淨值家庭提供新加坡市場准入、身分取得、稅務優化、資產配置的全方位專業服務',
            btn1: '探索服務方案',
            btn2: '安排第一次診斷會'
        },
        news: {
            title: '新聞動態',
            viewAll: '查看全部',
            empty: '暫無新聞'
        },
        whatWeDo: {
            title: '我們提供什麼',
            learnMore: '了解更多',
            service1: {
                title: '企業出海與落地',
                desc: '註冊/架構、銀行開戶、准入許可、園區與招商對接'
            },
            service2: {
                title: '身分與人才規劃',
                desc: 'EP/PR路徑、家族辦公室配套、子女教育與安頓、人才引進'
            },
            service3: {
                title: '財富與稅務架構',
                desc: '稅務協定/優化、VCC/信託/家辦、CRS合規、傳承工具'
            },
            service4: {
                title: '房地產與資產配置',
                desc: '新加坡商辦/住宅、柔佛機遇、資產組合配置、長租與保值增值'
            }
        },
        howWeWork: {
            title: '我們如何工作',
            step1: {
                title: '初步診斷',
                desc: '了解您的目標、資源與時間表'
            },
            step2: {
                title: '方案設計',
                desc: '定制化路徑與架構建議'
            },
            step3: {
                title: '執行落地',
                desc: '文件準備、對接機構、全程跟進'
            },
            step4: {
                title: '持續支持',
                desc: '合規維護、政策更新、資源對接'
            }
        },
        whyUs: {
            title: '為什麼選擇我們',
            reason1: {
                title: '深度在地網絡',
                desc: '與新加坡政府部門、專業機構建立長期合作'
            },
            reason2: {
                title: '全流程服務',
                desc: '從出海規劃到落地執行,一站式解決方案'
            },
            reason3: {
                title: '專業團隊',
                desc: '持牌會計師、律師、移民顧問組成的複合團隊'
            },
            reason4: {
                title: '華語服務',
                desc: '母語溝通,理解華人企業家的真實需求'
            }
        },
        cta: {
            title: '準備好開始了嗎?',
            subtitle: '預約免費診斷會議,了解如何穩健出海、傳承未來',
            button: '預約諮詢'
        }
    },
    about: {
        pageTitle: '關於我們',
        pageSubtitle: '企業主在不確定時代裡的"第二駕駛艙"',
        brandStory: {
            title: '品牌故事',
            paragraph1: '在全球經濟充滿不確定性的當下，企業出海不僅僅是物理空間的轉移，更是戰略視野的升級。<strong>通海南洋 (TongHai Nanyang)</strong> 總部位於新加坡，深耕新馬雙市場。我們不僅僅是您的出海服務商，更是企業主在風浪中的<strong>"第二駕駛艙"</strong>。',
            paragraph2: '我們匯聚了金融、法律、教育與稅務領域的頂尖專家，致力於為台灣企業家、跨國企業主及高淨值家族提供「企業落地 + 身份規劃 + 資產架構」的一站式跨境解決方案。我們堅持<strong>合規優先</strong>，以<strong>長期陪跑</strong>為承諾，助您在南洋這片熱土上，穩健出海，傳承未來。'
        },
        coreValues: {
            title: '核心價值觀',
            compliance: {
                title: '合規優先',
                desc: '嚴格遵循當地法律法規，確保業務架構穩健安全'
            },
            goalOriented: {
                title: '以終為始',
                desc: '量身定制最適合的落地與傳承方案'
            },
            transparency: {
                title: '透明可追溯',
                desc: '關鍵節點可追溯，每一次決策都有據可依'
            },
            longTerm: {
                title: '長期陪跑',
                desc: '長期陪伴企業成長與家族傳承'
            }
        },
        coreTeam: {
            title: '核心團隊',
            intro: '我們的團隊由資深金融專家、律師、教育顧問和商業策略師組成，為您提供全方位專業服務。',
            members: {
                ada: {
                    name: 'Ada 黃芊惠',
                    position: '創始人 | CEO',
                    bio: 'Finexis Advisory 總監，18年新加坡金融經驗，CFP® 認證顧問'
                },
                mars: {
                    name: 'Mars 楊棟',
                    position: '聯合創始人',
                    bio: '新加坡文化與教育協會會長，28年國際教育經驗'
                },
                wendy: {
                    name: 'Wendy 魏文帝',
                    position: '台灣執行官',
                    bio: '創投公司 CEO，20年企業顧問經驗'
                }
            }
        },
        cta: {
            title: '與我們的專家團隊見面',
            subtitle: '預約會議，了解我們如何協助您的業務成長',
            button: '預約諮詢'
        }
    },
    team: {
        pageTitle: '我們的團隊',
        pageSubtitle: '匯聚金融、法律、教育與稅務領域的頂尖專家，為您的出海之路保駕護航',
        categories: {
            founders: {
                title: 'FOUNDERS & EXECUTIVES',
                subtitle: '創始人與高管層'
            },
            advisors: {
                title: 'INDUSTRY ADVISORS',
                subtitle: '行業專家顧問（法律、金融、物流）'
            },
            consulting: {
                title: 'CONSULTING & WEALTH',
                subtitle: '商業諮詢與理財團隊'
            },
            regional: {
                title: 'REGIONAL HEADS',
                subtitle: '區域負責人'
            }
        },
        members: {
            founders: {
                ada: {
                    name: 'Ada 黃芊惠',
                    position: '通海南洋創始人 | CEO',
                    tags: ['CFP®', 'WMI 家辦顧問'],
                    bio: ['Finexis Advisory 總監, BNI 新加坡寶豐分會主席 (2022-2023)', '留學移民新加坡18年，專注一站式金融解決方案，包括保險、基金、家族信託、VCC 及銀行開戶等。']
                },
                mars: {
                    name: 'Mars 楊棟',
                    position: '聯合創始人 | 跨境商業落地執行官',
                    tags: ['北京社科院數學博士'],
                    bio: ['新加坡文化與教育協會會長 (CEAS), 新加坡文化與教育學院院長', '擁有28年國際教育經驗。負責市場考察與落地、身份與教育規劃及本地化運營。']
                },
                wendy: {
                    name: 'Wendy 魏文帝',
                    position: '跨境商業落地執行官（台灣）',
                    tags: ['創投公司 CEO'],
                    bio: ['擁有超過20年企業顧問經驗, 擅長資源整合與銷售。', '具備敏銳的市場分析能力, 為台灣企業家提供專業落地建議。']
                }
            },
            advisors: {
                thomas: {
                    name: 'Prof. Dr Thomas Sim',
                    position: 'FIATA 主席 | 海聯集團 CEO',
                    desc: '新加坡物流學院主席, 世界銀行、聯合國貿發會議資源專家。獲新加坡總統頒發國家獎項。'
                },
                gavin: {
                    name: 'Gavin 柳達禮',
                    position: '東方投融金控集團創始人',
                    desc: '30多年金融經驗, 擅長投資及操盤科技企業上市。專注於大健康、AI 經濟及 RWA 技術。'
                },
                linus: {
                    name: 'Linus 伍修宏',
                    position: '敦升律師事務所大律師',
                    desc: '1998年註冊律師, 專注資本市場融資、私募基金、合規諮詢及金融科技法律服務。'
                },
                ronald: {
                    name: 'Ronald 朱國禎',
                    position: '朱國禎律師事務所創始人',
                    desc: '全球家辦 (GFO) 協會會員。提供 GIP、PR 申請、家辦設立及遺囑認證服務。'
                }
            },
            consulting: {
                wendyLiu: {
                    name: 'Wendy 劉泳岐',
                    position: 'Finnex Pte Ltd 業務發展總監',
                    desc: '10年商業顧問經驗, 與超過60間銀行合作。擅長企業融資與市場進軍策略。'
                },
                jevon: {
                    name: 'Jevon 何建洛',
                    position: 'Finnex Pte Ltd 政府津貼顧問',
                    desc: '25年經商經驗, KAH 執照持有人。專精政府津貼諮詢、企業策略轉型。'
                },
                martin: {
                    name: 'Martin 許岩',
                    position: '資深理財規劃師 (Finexis)',
                    desc: '英國倫敦大學學士。深耕新加坡金融業多年, 為高淨值客戶提供財富管理服務。'
                }
            },
            regional: {
                chenLi: {
                    name: '陳利',
                    position: '四川辦事處負責人',
                    desc: '常駐成都, 協助中國企業家開拓東南亞市場, 提供全鏈路出海解決方案。'
                },
                mayLee: {
                    name: 'May Lee',
                    position: '馬來西亞負責人',
                    desc: '農先生集團董事長, BNI 巴生資深顧問。專精資產配置、MM2H 申請及戰略規劃。'
                },
                andy: {
                    name: 'Andy Chia 謝漢亮',
                    position: 'Jalin 家寧 業務發展總監',
                    desc: '20年金融服務經驗 (UOB, HSBC)。深厚新馬金融網絡, 提供跨境金融及房產服務。'
                }
            }
        },
        cta: {
            title: '諮詢我們的專家團隊',
            subtitle: '點擊下方按鈕，與我們的顧問安排一次深入的診斷會',
            button: '預約專家會議'
        }
    },
    footer: {
        companyName: '通海南洋',
        tagline: '穩健出海 · 傳承未來',
        quickLinks: '快速連結',
        contactInfo: '聯絡資訊',
        disclaimer: '本網站內容僅供一般資訊與客戶教育之用,不構成法律、稅務或投資建議。具體方案需依個案背景與當地法規評估,並由持牌/合資格專業人士提供意見。',
        copyright: '© 2026 通海南洋咨詢有限公司 版權所有'
    },
    contact: {
        pageTitle: '聯絡我們',
        pageSubtitle: '讓我們了解您的目標，提供專業的解決方案',
        form: {
            title: '填寫諮詢表單',
            subtitle: '請填寫以下信息，我們的顧問將在24小時內與您聯繫，提供初步評估方案。',
            name: '姓名',
            namePlaceholder: '請輸入您的姓名',
            company: '公司/家族名稱',
            companyPlaceholder: '請輸入公司或家族名稱（選填）',
            services: {
                label: '您感興趣的服務',
                corporate: '企業出海與銀行開戶',
                identity: '身份規劃 (EP/PR/MM2H)',
                asset: '資產與稅務架構 (VCC/信託)',
                education: '教育留學規劃',
                other: '其他'
            },
            timeline: {
                label: '預計啟動時間',
                '1month': '1個月內急需',
                '3months': '3個月內',
                '6months': '半年內規劃',
                exploring: '僅先了解/觀望'
            },
            contactMethod: {
                label: '聯絡方式',
                placeholder: '手機/微信/WhatsApp/Email'
            },
            message: {
                label: '補充說明',
                placeholder: '請告訴我們更多關於您的需求...'
            },
            submit: '送出諮詢',
            successMessage: '提交成功！我們會盡快與您聯繫。',
            errorMessage: '提交失敗，請重試。',
            validation: {
                name: '請輸入您的姓名',
                contactMethod: '請提供聯絡方式',
                services: '請至少選擇一項服務'
            }
        },
        info: {
            title: '聯絡信息',
            address: {
                title: '地址',
                content: '20 Anson Road, Level 6, #06-66, Twenty Anson, Singapore 079912'
            },
            email: {
                title: 'Email'
            },
            hours: {
                title: '工作時間',
                content: 'Mon - Fri, 9:00 AM - 6:00 PM (SGT)'
            }
        },
        why: {
            title: '為什麼選擇我們？',
            items: [
                '專業團隊，持牌顧問',
                '全方位一站式服務',
                '透明合規，可追溯',
                '長期陪跑，承諾服務'
            ]
        }
    },
    chat: {
        title: '智能助手',
        open: '打開聊天',
        close: '關閉聊天',
        online: '在線',
        welcome: '您好！我是通海南洋的智能助手，有什麼可以幫助您的嗎？',
        inputPlaceholder: '輸入您的問題...',
        errorMessage: '抱歉，系統出現問題，請稍後再試。',
        helpful: '有幫助',
        notHelpful: '沒幫助',
        relatedQuestions: '相關問題：',
        contactHuman: '聯繫真人顧問',
        quickActions: {
            services: '你們提供哪些服務？',
            ep: '如何申請新加坡EP？',
            company: '新加坡公司註冊條件？',
            contact: '如何預約諮詢？'
        }
    },

    news: {
        title: '新聞資訊',
        subtitle: '掌握行業動態，把握商機脈搏',
        all: '全部',
        company: '公司動態',
        industry: '行業新聞',
        top: '置頂',
        popular: '熱門文章',
        empty: '暫無新聞',
        views: '瀏覽',
        source: '原文鏈接',
        share: '分享',
        linkCopied: '鏈接已複製',
        backToList: '返回列表',
        notFound: '文章不存在',
        needHelp: '需要專業諮詢？',
        helpDesc: '我們的顧問團隊隨時為您提供一對一服務',
        contactUs: '聯繫我們'
    }
}

export default zhTW

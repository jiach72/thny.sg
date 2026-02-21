/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
    console.log('开始生成 FAQ 种子数据...')

    // 1. 清理现有数据 (可选，这里我们选择追加或更新)
    // await prisma.faqItem.deleteMany()
    // await prisma.faqCategory.deleteMany()

    // ==================== 1. 新加坡移民 ====================
    const sgImmigration = await prisma.faqCategory.upsert({
        where: { id: 'cat-sg-immigration' },
        update: {},
        create: {
            id: 'cat-sg-immigration',
            name: '新加坡移民',
            nameEn: 'Singapore Immigration',
            description: '新加坡工作准证(EP/SP)、永久居民(PR)及投资移民相关问题',
            sortOrder: 1,
            isActive: true
        }
    })

    const sgImmigrationItems = [
        {
            question: '新加坡家族办公室(Family Office)的申请门槛是多少？',
            questionEn: 'What is the threshold for applying for a Singapore Family Office?',
            answer: '根据新加坡金管局(MAS)的最新规定（13O计划），申请家族办公室主要有以下要求：\n1. **资产管理规模**：申请时资产管理规模(AUM)需达到至少1000万新币，并在两年内增加到2000万新币。\n2. **运营支出**：每年本地业务支出至少20万新币。\n3. **专业人员**：需要雇佣至少两名投资专业人员（可以是家族成员或非家族成员）。\n4. **获批身份**：主申请人可获得就业准证(EP)，进而申请PR。\n\n注：政策可能随时间调整，具体请以MAS最新公告为准。',
            keywords: ['家族办公室', '13O', 'GIP', '投资移民', 'EP'],
            sortOrder: 10
        },
        {
            question: '申请新加坡永久居民(PR)需要多长时间？',
            questionEn: 'How long does it take to apply for Singapore Permanent Residence (PR)?',
            answer: '一般情况下，ICA 官方说明的处理时间为 **4-6 个月**。但实际情况因人而异：\n- 条件优异者（如高薪、高学历、紧缺行业）可能在 4 个月内获批。\n- 部分复杂案例可能需要 9-12 个月甚至更久。\n\n建议在持有 EP/SP 准证满 1-2 年后申请，且期间有良好的缴税记录。',
            keywords: ['PR', '永久居民', '申请时间', 'ICA'],
            sortOrder: 20
        },
        {
            question: 'EP (Employment Pass) 和 SP (S Pass) 有什么区别？',
            questionEn: 'What is the difference between EP (Employment Pass) and SP (S Pass)?',
            answer: '**EP (Employment Pass)**：\n- 对象：高管、专业人士。\n- 薪资要求：月薪至少 5,000 新币（金融业 5,500 新币）。\n- 学历：通常需要良好的大学学位。\n- 配额：没有配额限制。\n- 家属：6,000 新币以上可带配偶/孩子。\n\n**SP (S Pass)**：\n- 对象：中级技术人员。\n- 薪资要求：月薪至少 3,150 新币。\n- 学历：学位或文凭。\n- 配额：受公司外劳配额(Quota)限制。\n- 人头税：雇主需每月支付 Levy。',
            keywords: ['EP', 'SP', '工作准证', '区别', '薪资'],
            sortOrder: 30
        },
        {
            question: '自雇EP（Self-Employed EP）是如何操作的？',
            questionEn: 'How does Self-Employed EP work?',
            answer: '自雇 EP 是指申请人在新加坡注册一家私人有限公司，自己担任董事或高管，并以该公司名义申请 EP。\n\n**核心要求**：\n1. **真实运营**：公司需有实际办公地点、真实业务合同及流水。\n2. **本地雇佣**：建议雇佣 1-2 名本地员工（SC/PR）并缴纳 CPF。\n3. **注册资本**：建议实缴资本 5-10 万新币以上。\n4. **薪资**：申请人自发薪资需达到 EP 标准（5,000+ 新币）。\n\n这是通海南洋目前最热门的移民方案之一。',
            keywords: ['自雇EP', '创业移民', 'PIC', '开公司'],
            sortOrder: 40
        }
    ]

    for (const item of sgImmigrationItems) {
        await prisma.faqItem.create({
            data: {
                ...item,
                categoryId: sgImmigration.id,
                isActive: true
            }
        })
    }

    // ==================== 2. 马来西亚移民 ====================
    const myImmigration = await prisma.faqCategory.upsert({
        where: { id: 'cat-my-immigration' },
        update: {},
        create: {
            id: 'cat-my-immigration',
            name: '马来西亚移民',
            nameEn: 'Malaysia Immigration',
            description: '马来西亚第二家园(MM2H)及工作签证',
            sortOrder: 2,
            isActive: true
        }
    })

    const myImmigrationItems = [
        {
            question: '马来西亚第二家园(MM2H)最新政策有哪些变化？',
            questionEn: 'What are the latest changes to the Malaysia My Second Home (MM2H) policy?',
            answer: '马来西亚政府对 MM2H 进行了分级（银卡、金卡、铂金卡）：\n\n**1. 铂金卡 (Platinum)**\n- 存款：500万马币\n- 居留权：永久居留许可(PR)资格申请通道\n- 房产：可购买任意价格房产\n\n**2. 金卡 (Gold)**\n- 存款：200万马币\n- 签证：15年\n\n**3. 银卡 (Silver)**\n- 存款：50万马币\n- 签证：5年\n\n**共同要求**：一年需在马居住至少 60 天；主申请人年满 30 岁。',
            keywords: ['MM2H', '第二家园', '存款', '买房'],
            sortOrder: 10
        },
        {
            question: '持有 MM2H 可以在马来西亚工作吗？',
            questionEn: 'Can I work in Malaysia with MM2H?',
            answer: '原则上 MM2H 是长期居留签证，**不允许**直接受雇工作。但有以下例外：\n1. 50岁以上申请人，若拥有专业技能，可申请兼职工作（需获移民局批准，每周不超过20小时）。\n2. 可以在马来西亚注册公司并担任董事（Director），可以分红，但不建议直接领取薪水（因为视为工作）。\n\n若需全职工作，建议申请专业工作签证（Category I, II, III）。',
            keywords: ['MM2H', '工作', '经商', '注册公司'],
            sortOrder: 20
        }
    ]

    for (const item of myImmigrationItems) {
        await prisma.faqItem.create({
            data: {
                ...item,
                categoryId: myImmigration.id,
                isActive: true
            }
        })
    }

    // ==================== 3. 新加坡留学 ====================
    const sgEducation = await prisma.faqCategory.upsert({
        where: { id: 'cat-sg-education' },
        update: {},
        create: {
            id: 'cat-sg-education',
            name: '新加坡留学',
            nameEn: 'Study in Singapore',
            description: '政府学校(AEIS)、国际学校申请及陪读政策',
            sortOrder: 3,
            isActive: true
        }
    })

    const sgEducationItems = [
        {
            question: '什么是 AEIS 考试？',
            questionEn: 'What is the AEIS exam?',
            answer: '**AEIS (Admissions Exercise for International Students)** 是新加坡教育部为希望进入新加坡政府中小学的国际学生组织的统一入学考试。\n\n- **考试时间**：每年 9 月（S-AEIS 补考在次年 2 月）。\n- **科目**：英语、数学。\n- **年级**：小二至小五，中一至中三。\n- **录取**：根据考试成绩和学校空缺统一分配，不公布具体分数。\n\n这是进入政府学校（学费低、师资强）的唯一途径。',
            keywords: ['AEIS', '政府学校', '入学考试', '公立'],
            sortOrder: 10
        },
        {
            question: '新加坡知名国际学校有哪些？',
            questionEn: 'What are the famous international schools in Singapore?',
            answer: '新加坡拥有世界顶级的国际学校资源，通常分为三类：\n\n1. **英系（IB/A-Level）**：\n   - UWCSEA (东南亚联合世界书院)：被称为"小联合国"，最难进，全人教育。\n   - Tanglin Trust (东陵信托)：老牌英校，学术极强。\n   - Dulwich (德威)：英式精英教育。\n\n2. **美系（AP）**：\n   - SAS (新加坡美国学校)：规模大，纯美式。\n   - SAIS (斯坦福美国国际)：设施一流，IB+AP。\n\n3. **华文特色**：\n   - HCIS (华中国际)：学术强，IB 成绩全球领先。\n   - ACS (英华国际)：本地名校背景。\n\n我们可根据孩子的情况提供择校评估服务。',
            keywords: ['国际学校', 'UWC', 'SAS', 'IB', '德威'],
            sortOrder: 20
        },
        {
            question: '妈妈可以来新加坡陪读吗？',
            questionEn: 'Can mothers come to Singapore to accompany their children?',
            answer: '可以。新加坡是世界上少数允许“陪读妈妈”的国家之一。\n\n**条件**：\n1. 孩子年龄：3-16 岁。\n2. 就读学校：需被**政府学校**或**持有 EduTrust 认证的国际学校**录取。\n3. 申请人：妈妈、祖母或外祖母（三人中只能一人陪读）。\n\n**工作限制**：\n陪读第一年通常不允许工作。第二年起，如果找到雇主申请到工作准证，可以合法工作。',
            keywords: ['陪读', '陪读签证', '妈妈', '工作'],
            sortOrder: 30
        },
        {
            question: '新加坡留学一年的费用大概是多少？',
            questionEn: 'What is the approximate cost of studying in Singapore for a year?',
            answer: '**1. 学费（年）**：\n- 政府学校：6,000 - 15,000 新币\n- 私立/教会学校：15,000 - 25,000 新币\n- 国际学校：30,000 - 50,000 新币\n\n**2. 生活费（年）**：\n- 住宿：12,000 - 24,000 新币（租房或寄宿）\n- 餐饮：6,000 - 9,000 新币\n- 交通及其他：2,000 - 4,000 新币\n\n**总计**：\n- 读政府学校约 15-20 万人民币/年。\n- 读国际学校约 30-50 万人民币/年。',
            keywords: ['学费', '费用', '生活费', '预算'],
            sortOrder: 40
        }
    ]

    for (const item of sgEducationItems) {
        await prisma.faqItem.create({
            data: {
                ...item,
                categoryId: sgEducation.id,
                isActive: true
            }
        })
    }

    // ==================== 4. 生活指南 ====================
    const sgLife = await prisma.faqCategory.upsert({
        where: { id: 'cat-sg-life' },
        update: {},
        create: {
            id: 'cat-sg-life',
            name: '新加坡生活',
            nameEn: 'Living in Singapore',
            description: '租房、银行开户、交通等生活服务',
            sortOrder: 4,
            isActive: true
        }
    })

    const sgLifeItems = [
        {
            question: '外国人在新加坡如何开设银行账户？',
            questionEn: 'How can foreigners open a bank account in Singapore?',
            answer: '外国人主要有两种开户情况：\n\n1. **已有准证（EP/SP/Student Pass）**：\n   - 所需材料：护照、准证、地址证明（水电单/租约）。\n   - 推荐银行：DBS, OCBC, UOB（均支持线上申请）。\n\n2. **无准证（游客/远程开户）**：\n   - 难度较大，通常需要存入高额资金（如 Citigold, HSBC Premier，门槛 20万新币起）。\n   - 或通过设立公司开设商业账户。\n\n我们也提供协助预约贵宾开户服务。',
            keywords: ['银行开户', 'DBS', 'OCBC', '账户'],
            sortOrder: 10
        },
        {
            question: '在新加坡租房需要注意什么？',
            questionEn: 'What should I pay attention to when renting a house in Singapore?',
            answer: '1. **印花税(Stamp Duty)**：签约后需缴纳，通常由租客承担（年租金的 0.4% 左右）。\n2. **租期**：一般至少 1 年，HDB 最短 6 个月，私宅最短 3 个月（短租需合法）。\n3. **空调清洗**：通常合同规定租客需每 3 个月清洗一次空调并保留收据。\n4. **外交官条款(Diplomatic Clause)**：租期超过 1 年时，如有此条款，因工作调动离境可提前解约（通常需住满 12 个月 + 2 个月通知期）。',
            keywords: ['租房', '印花税', '合同', '空调'],
            sortOrder: 20
        }
    ]

    for (const item of sgLifeItems) {
        await prisma.faqItem.create({
            data: {
                ...item,
                categoryId: sgLife.id,
                isActive: true
            }
        })
    }

    console.log('FAQ 种子数据生成完毕！')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

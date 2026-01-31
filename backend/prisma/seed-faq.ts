import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const faqData = {
    categories: [
        {
            name: '公司注册',
            nameEn: 'Company Registration',
            description: '新加坡和马来西亚公司注册相关问题',
            sortOrder: 1
        },
        {
            name: '身份规划',
            nameEn: 'Residency Planning',
            description: 'EP/PR/MM2H 等签证和身份规划',
            sortOrder: 2
        },
        {
            name: '资产配置',
            nameEn: 'Asset Management',
            description: '保险、信托、VCC、房产等',
            sortOrder: 3
        },
        {
            name: '其他咨询',
            nameEn: 'General Inquiries',
            description: '联系方式、服务流程等',
            sortOrder: 4
        }
    ],
    items: [
        // 公司注册
        {
            category: '公司注册',
            question: '在新加坡注册公司需要什么条件？',
            questionEn: 'What are the requirements for registering a company in Singapore?',
            answer: '在新加坡注册公司的主要条件包括：\n1. 至少1名股东（可以是个人或公司）\n2. 至少1名本地董事（新加坡公民/PR/EP持有者）\n3. 本地注册地址\n4. 法定秘书\n5. 最低注册资本1新币\n\n我们提供一站式公司注册服务，欢迎预约咨询。',
            answerEn: 'Main requirements for Singapore company registration:\n1. At least 1 shareholder (individual or corporate)\n2. At least 1 local director (Singapore citizen/PR/EP holder)\n3. Local registered address\n4. Company secretary\n5. Minimum paid-up capital of S$1\n\nWe provide one-stop incorporation services. Book a consultation for details.',
            keywords: ['注册', '公司', '新加坡', '条件', '要求', 'registration', 'company', 'incorporate']
        },
        {
            category: '公司注册',
            question: '注册新加坡公司需要多长时间？',
            questionEn: 'How long does it take to register a Singapore company?',
            answer: '一般情况下，新加坡公司注册可在1-3个工作日内完成。如果您已准备好所有必要文件，最快可在当天完成。\n\n所需文件包括：\n• 护照复印件\n• 地址证明\n• 公司名称（需先核准）\n• 业务描述\n\n我们可协助您准备所有文件并加速流程。',
            answerEn: 'Singapore company registration typically takes 1-3 business days. Same-day incorporation is possible if all documents are ready.\n\nRequired documents:\n• Passport copy\n• Proof of address\n• Company name (pre-approved)\n• Business description\n\nWe can help prepare all documents and expedite the process.',
            keywords: ['时间', '多久', '注册', '速度', 'how long', 'time', 'duration']
        },
        {
            category: '公司注册',
            question: '新加坡公司的税率是多少？',
            questionEn: 'What is the corporate tax rate in Singapore?',
            answer: '新加坡企业所得税率为17%，是全球最低之一。此外还有多项优惠：\n\n• 新公司前三年享受部分免税\n• 首10万新币应税收入享受75%减免\n• 接下来10万新币享受50%减免\n• 多项政府津贴可申请\n\n我们提供税务规划服务，帮您最大化税务优惠。',
            answerEn: 'Singapore corporate tax rate is 17%, among the lowest globally. Additional benefits:\n\n• New companies enjoy partial tax exemption for first 3 years\n• 75% exemption on first S$100,000 of chargeable income\n• 50% exemption on next S$100,000\n• Various government grants available\n\nWe provide tax planning services to maximize your benefits.',
            keywords: ['税', '税率', '税务', 'tax', 'rate', 'corporate tax']
        },
        // 身份规划
        {
            category: '身份规划',
            question: '如何申请新加坡EP工作签证？',
            questionEn: 'How to apply for Singapore Employment Pass (EP)?',
            answer: 'EP申请要求：\n\n1. **月薪要求**：5,000新币起（金融服务行业更高）\n2. **学历**：认可的大学学位\n3. **工作经验**：相关领域经验\n4. **担保公司**：需有本地注册公司作为雇主\n\n**自雇EP**：您也可以通过自己的公司申请EP，需满足公司运营要求。\n\n我们提供EP申请全程协助，成功率高。',
            answerEn: 'EP requirements:\n\n1. **Salary**: From S$5,000/month (higher for financial services)\n2. **Education**: Recognized university degree\n3. **Experience**: Relevant work experience\n4. **Sponsor**: Local registered company as employer\n\n**Self-employed EP**: You can apply through your own company with operational requirements.\n\nWe provide end-to-end EP application assistance with high success rate.',
            keywords: ['EP', '工作签证', '申请', '就业准证', 'employment pass', 'work visa']
        },
        {
            category: '身份规划',
            question: '新加坡PR永久居民怎么申请？',
            questionEn: 'How to apply for Singapore Permanent Residence (PR)?',
            answer: 'PR申请途径：\n\n1. **EP/SP持有者**：工作一定年限后可申请\n2. **投资移民(GIP)**：投资250万新币起\n3. **家族办公室(13O/13U)**：满足条件可申请\n\n**申请要点**：\n• 稳定的收入和税务记录\n• 社会融入（子女教育、置业等）\n• 对新加坡的长期承诺\n\n审批时间：通常4-6个月\n\n我们提供PR申请规划和材料优化服务。',
            answerEn: 'PR application pathways:\n\n1. **EP/SP holders**: Apply after working for some years\n2. **GIP**: Investment from S$2.5 million\n3. **Family Office (13O/13U)**: Meet qualifying conditions\n\n**Key factors**:\n• Stable income and tax records\n• Social integration (education, property)\n• Long-term commitment to Singapore\n\nProcessing time: Usually 4-6 months\n\nWe provide PR application planning and document optimization.',
            keywords: ['PR', '永久居民', '移民', 'permanent resident', 'immigration']
        },
        // 资产配置
        {
            category: '资产配置',
            question: '什么是家族办公室？有什么优势？',
            questionEn: 'What is a Family Office and what are its benefits?',
            answer: '**家族办公室**是为超高净值家族管理财富的专业实体。\n\n**新加坡家办优势**：\n1. 13O/13U税务豁免计划\n2. 资产保护和隔离\n3. 家族治理和传承规划\n4. 投资灵活性\n5. EP/PR申请通道\n\n**设立门槛**：\n• 资产管理规模：建议1,000万新币起\n• 年度运营费用：40万新币起\n\n我们提供家办设立和运营的全程支持。',
            answerEn: '**Family Office** is a professional entity managing wealth for UHNW families.\n\n**Singapore Family Office benefits**:\n1. 13O/13U tax exemption schemes\n2. Asset protection and segregation\n3. Family governance and succession planning\n4. Investment flexibility\n5. EP/PR application pathway\n\n**Requirements**:\n• AUM: Recommended from S$10 million\n• Annual operating expenses: From S$400,000\n\nWe provide end-to-end family office setup and operational support.',
            keywords: ['家族办公室', '家办', '13O', '13U', 'family office', 'FO']
        },
        {
            category: '资产配置',
            question: '新加坡保险有什么优势？',
            questionEn: 'What are the advantages of Singapore insurance?',
            answer: '**新加坡保险优势**：\n\n1. **监管严格**：MAS严格监管，保障性高\n2. **产品多元**：储蓄险、投资险、终身寿险\n3. **资产保护**：某些情况下可豁免债权人追索\n4. **遗产规划**：指定受益人，不纳入遗产\n5. **多币种选择**：美元、新币、人民币\n\n**适合人群**：\n• 追求稳健理财的家庭\n• 有资产配置需求的企业主\n• 需要遗产规划的高净值人士\n\n我们团队拥有CFP®认证，提供专业保险规划。',
            answerEn: '**Singapore Insurance advantages**:\n\n1. **Strict regulation**: MAS oversight ensures protection\n2. **Diverse products**: Savings, investment, whole life\n3. **Asset protection**: Creditor protection in some cases\n4. **Estate planning**: Named beneficiaries, outside estate\n5. **Multi-currency**: USD, SGD, CNY options\n\n**Suitable for**:\n• Families seeking stable wealth growth\n• Business owners with allocation needs\n• HNWIs requiring estate planning\n\nOur team has CFP® certification for professional planning.',
            keywords: ['保险', '储蓄', '终身寿险', 'insurance', 'savings', 'protection']
        },
        // 其他咨询
        {
            category: '其他咨询',
            question: '你们提供哪些服务？',
            questionEn: 'What services do you provide?',
            answer: '**通海南洋**提供一站式跨境服务：\n\n🏢 **企业出海**\n• 新马公司注册\n• 银行开户协助\n• 会计年审\n\n🌏 **身份规划**\n• EP/PR申请\n• 家族办公室\n• MM2H\n\n💰 **资产配置**\n• 新加坡保险\n• VCC/信托\n• 房产投资\n\n🎓 **教育规划**\n• 学校申请\n• 学生公寓\n\n📊 **税务津贴**\n• 企业税务\n• 政府津贴\n\n欢迎预约免费咨询！',
            answerEn: '**TongHai Nanyang** provides one-stop cross-border services:\n\n🏢 **Market Entry**\n• Singapore/Malaysia incorporation\n• Banking assistance\n• Accounting & compliance\n\n🌏 **Residency Planning**\n• EP/PR applications\n• Family Office\n• MM2H\n\n💰 **Asset Management**\n• Singapore insurance\n• VCC/Trust\n• Property investment\n\n🎓 **Education**\n• School applications\n• Student accommodation\n\n📊 **Tax & Grants**\n• Corporate tax\n• Government grants\n\nBook a free consultation!',
            keywords: ['服务', '业务', '做什么', 'services', 'what do you do', 'offerings']
        },
        {
            category: '其他咨询',
            question: '如何预约咨询？',
            questionEn: 'How to book a consultation?',
            answer: '**预约方式**：\n\n1. 📧 邮件：admin@thny.sg\n2. 🌐 网站：填写联系表单\n3. 📱 微信/WhatsApp：扫码添加\n\n**咨询流程**：\n1. 初步沟通了解需求\n2. 安排视频/面对面诊断会\n3. 提供定制化方案\n4. 确认后开始执行\n\n首次诊断会免费，欢迎联系！',
            answerEn: '**Booking options**:\n\n1. 📧 Email: admin@thny.sg\n2. 🌐 Website: Fill contact form\n3. 📱 WeChat/WhatsApp: Scan to add\n\n**Process**:\n1. Initial needs assessment\n2. Video/in-person consultation\n3. Customized proposal\n4. Execution upon confirmation\n\nFirst consultation is free. Contact us!',
            keywords: ['预约', '咨询', '联系', '怎么', 'book', 'contact', 'consultation', 'how to']
        },
        {
            category: '其他咨询',
            question: '你们公司在哪里？',
            questionEn: 'Where is your office located?',
            answer: '**新加坡总部**\n📍 地址：20 Anson Road, Level 6, #06-66, Twenty Anson, Singapore 079912\n\n⏰ 工作时间：周一至周五 9:00 AM - 6:00 PM (SGT)\n\n📧 邮箱：admin@thny.sg\n\n我们在新加坡和马来西亚均有团队，可提供中英文服务。',
            answerEn: '**Singapore Headquarters**\n📍 Address: 20 Anson Road, Level 6, #06-66, Twenty Anson, Singapore 079912\n\n⏰ Hours: Mon-Fri 9:00 AM - 6:00 PM (SGT)\n\n📧 Email: admin@thny.sg\n\nWe have teams in Singapore and Malaysia, offering services in Chinese and English.',
            keywords: ['地址', '在哪', '位置', '地点', 'address', 'location', 'where', 'office']
        }
    ]
}

async function seedFaqs() {
    console.log('🌱 开始导入 FAQ 数据...')

    // 创建分类
    const categoryMap: Record<string, string> = {}

    for (const cat of faqData.categories) {
        const created = await prisma.faqCategory.create({
            data: cat
        })
        categoryMap[cat.name] = created.id
        console.log(`  ✓ 创建分类: ${cat.name}`)
    }

    // 创建 FAQ 条目
    for (const item of faqData.items) {
        const categoryId = categoryMap[item.category]
        if (!categoryId) {
            console.warn(`  ⚠ 找不到分类: ${item.category}`)
            continue
        }

        await prisma.faqItem.create({
            data: {
                question: item.question,
                questionEn: item.questionEn,
                answer: item.answer,
                answerEn: item.answerEn,
                keywords: item.keywords,
                categoryId
            }
        })
        console.log(`  ✓ 创建 FAQ: ${item.question.substring(0, 30)}...`)
    }

    console.log('\n✅ FAQ 数据导入完成!')
    console.log(`   分类: ${faqData.categories.length} 个`)
    console.log(`   条目: ${faqData.items.length} 个`)
}

seedFaqs()
    .catch(e => {
        console.error('❌ 导入失败:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())

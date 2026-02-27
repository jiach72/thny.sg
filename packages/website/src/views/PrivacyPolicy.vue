<template>
  <div class="privacy-page">
    <!-- Page Hero -->
    <section class="page-hero gradient-bg">
      <div class="container">
        <h1 class="page-title">隐私政策</h1>
        <p class="page-subtitle">Privacy Policy</p>
      </div>
    </section>

    <section class="section privacy-content">
      <div class="container">
        <div class="content-wrapper">
          <p class="update-date">最后更新日期：2026 年 2 月 23 日</p>

          <h2>1. 信息收集</h2>
          <p>通海南洋 (TongHai Nanyang Pte. Ltd.) 通过以下方式收集您的个人信息：</p>
          <ul>
            <li>联系表单提交（姓名、邮箱、电话、公司名称）</li>
            <li>在线咨询和预约</li>
            <li>客户门户注册和使用</li>
            <li>Cookie 和网站分析工具</li>
          </ul>

          <h2>2. 信息使用</h2>
          <p>我们收集的个人信息仅用于以下目的：</p>
          <ul>
            <li>回复您的咨询和服务请求</li>
            <li>提供约定的专业咨询服务</li>
            <li>发送与服务相关的通知和更新</li>
            <li>改进网站功能和用户体验</li>
            <li>遵守法律法规要求</li>
          </ul>

          <h2>3. 数据保护</h2>
          <p>我们采取合理的技术和组织措施保护您的个人信息安全，包括：</p>
          <ul>
            <li>数据传输使用 SSL/TLS 加密</li>
            <li>服务器访问控制和权限管理</li>
            <li>定期安全审查和更新</li>
            <li>员工数据保护培训</li>
          </ul>

          <h2>4. 数据共享</h2>
          <p>我们不会将您的个人信息出售或出租给第三方。仅在以下情况下可能共享：</p>
          <ul>
            <li>经您明确同意</li>
            <li>为提供服务所必需的合作伙伴（如律师事务所、会计事务所）</li>
            <li>法律法规要求</li>
          </ul>

          <h2>5. Cookie 使用</h2>
          <p>本网站使用 Cookie 和类似技术来改善您的浏览体验。您可以通过浏览器设置管理 Cookie 偏好。</p>

          <h2>6. 数据保留</h2>
          <p>我们仅在业务需要和法律要求的期限内保留您的个人数据。服务结束后，我们将在合理时间内安全删除或匿名化处理您的数据。</p>

          <h2>7. 您的权利</h2>
          <p>根据新加坡《个人数据保护法》(PDPA)，您有权：</p>
          <ul>
            <li>访问我们持有的您的个人数据</li>
            <li>更正不准确的个人数据</li>
            <li>撤回数据使用同意</li>
            <li>请求删除个人数据（在法律允许范围内）</li>
          </ul>

          <h2>8. 联系我们</h2>
          <p>如您对本隐私政策有任何疑问，或希望行使您的数据保护权利，请通过以下方式联系我们：</p>
          <ul>
            <li>邮箱：<a href="mailto:admin@thny.sg">admin@thny.sg</a></li>
            <li>地址：新加坡</li>
          </ul>

          <h2>9. 政策更新</h2>
          <p>我们可能不时更新本隐私政策。重大变更将通过网站公告或电子邮件通知您。继续使用我们的服务即表示您接受更新后的政策。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'

const route = useRoute()

useHead({
  title: () => (route.meta.title as string) || '隐私政策 | 通海南洋',
  meta: [
    { name: 'description', content: '通海南洋隐私政策 — 了解我们如何收集、使用和保护您的个人信息。' },
  ],
})
</script>

<style scoped>
.page-hero {
  padding: var(--spacing-3xl) 0;
  text-align: center;
  color: white;
}

.page-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
}

.privacy-content {
  background: var(--color-bg);
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.8;
  color: var(--color-text);
}

.update-date {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-2xl);
  font-style: italic;
}

.content-wrapper h2 {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: var(--spacing-2xl);
  margin-bottom: var(--spacing-md);
}

.content-wrapper p {
  margin-bottom: var(--spacing-md);
}

.content-wrapper ul {
  padding-left: 1.5rem;
  margin-bottom: var(--spacing-md);
}

.content-wrapper li {
  margin-bottom: var(--spacing-sm);
}

.content-wrapper a {
  color: var(--color-accent);
  text-decoration: none;
}

.content-wrapper a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}
</style>

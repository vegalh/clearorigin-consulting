import { test, expect } from '@playwright/test';

test.describe('Chinese and English versions', () => {
  test('switching to Chinese translates the site and is remembered', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('group', { name: 'Site language' }).getByRole('button', { name: '中文' }).click();

    await expect(page.getByRole('heading', { level: 1, name: '让中文成为你日常对话的一部分。' })).toBeVisible();
    await expect(page.getByRole('link', { name: '课程与价格' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: '让中文成为你日常对话的一部分。' })).toBeVisible();

    await page.getByRole('group', { name: '网站语言' }).getByRole('button', { name: 'EN' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Make Chinese part of your everyday conversations.' })).toBeVisible();
  });

  test('a full booking can be completed in Chinese', async ({ page }) => {
    await page.goto('/book?course=trial-lesson&lang=zh');
    await expect(page.getByRole('heading', { name: '选择老师和时间' })).toBeVisible();
    await page.locator('label', { has: page.getByRole('radio') }).filter({ hasText: '陈美雅' }).click();
    await expect(page.getByRole('heading', { name: '陈美雅的可约时间' })).toBeVisible();
    await page.locator('div.grid.grid-cols-3 button, div.grid.grid-cols-4 button').first().click();
    await page.getByRole('button', { name: '继续填写信息' }).click();

    await page.getByRole('button', { name: '继续付款' }).click();
    await expect(page.getByText('请填写你的姓名。')).toBeVisible();

    await page.getByLabel('姓名').fill('王小明');
    await page.getByLabel('邮箱').fill('xiaoming@example.com');
    await page.getByLabel('目前的中文水平').selectOption('beginner');
    await page.getByLabel('主要学习目标').selectOption('travel');
    await page.getByRole('button', { name: '继续付款' }).click();

    await expect(page.getByRole('heading', { name: '核对并付款' })).toBeVisible();
    await expect(page.getByText('银行卡支付 — 演示')).toBeVisible();
    await page.getByRole('button', { name: '支付 $15.00 USD（模拟）' }).click();
    await expect(page.getByRole('heading', { name: '预约成功！' })).toBeVisible();
    await expect(page.getByText('已付款（模拟）')).toBeVisible();
    await expect(page.getByText(/\d+月\d+日 星期/).first()).toBeVisible();
  });

  test('course, FAQ and status content is translated', async ({ page }) => {
    await page.goto('/courses?lang=zh');
    await expect(page.getByRole('heading', { level: 1, name: '课程与价格' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '5 节课套餐' })).toBeVisible();
    await expect(page.getByText('5 节 × 45 分钟')).toBeVisible();

    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: '取消与退款' })).toBeVisible();
    await expect(page.getByText('待 ClearOrigin 确认').first()).toBeAttached();

    await page.goto('/login');
    await page.getByRole('button', { name: /以 Alex Johnson 继续/ }).click();
    await expect(page.getByRole('heading', { name: '我的学习空间' })).toBeVisible();
    await expect(page.getByText('付款:').first()).toBeVisible();
  });
});

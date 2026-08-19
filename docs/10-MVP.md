# MVP — Product Definition

## Product goal

Build a beautiful, extremely simple personal-finance app for people aged roughly 25–40 who want to know:

1. How much money they have.
2. Where that money is.
3. Where their money is going.
4. How their net worth is evolving.

The product should feel closer to a premium consumer app than an accounting tool.

## Positioning

**Monefy-level simplicity + Margen-level visual ambition.**

The product is deliberately narrower than full personal-finance suites such as Wallet.

## Target user

Young adults, approximately 25–40, internationally distributed, with regular income and enough financial activity to benefit from tracking multiple accounts. They want visibility and control without budgets, financial planning or complex automation.

## Core principles

- Beautiful by default.
- Extremely simple.
- Fast to use.
- Manual-first.
- Privacy/control friendly: no bank connection in the initial product.
- International from day one.
- Every screen should answer a clear question.
- Avoid feature bloat.

## MVP navigation

### 1. Home

Primary purpose: understand the user's financial situation in seconds.

Should show:
- Total net worth / patrimonio.
- Change over time.
- Account balances.
- Current-period income.
- Current-period expenses.
- Current-period net result.
- Spending breakdown.
- Recent transactions.

Should not show:
- Budgets.
- Financial advice.
- Crypto.
- Property/car valuation.
- Debt management.
- Complex investment analytics.

### 2. Transactions

Primary purpose: see and manage all income and expenses.

Required:
- Chronological list.
- Search/filter.
- Expense vs income distinction.
- Merchant.
- Amount.
- Category.
- Account.
- Date.
- Edit/delete.

Merchant logos are a core visual feature, inspired by Margen.

### 3. Add transaction

This is the product's most important interaction.

Goal: a user should be able to record a normal expense in seconds.

Required fields:
- Amount.
- Expense/income.
- Merchant/description.
- Category.
- Account.
- Date (default today).

UX principles:
- Amount should be the visual focus.
- Defaults should minimize typing.
- Recent/frequent merchants should be easy to select.
- Categories should be visually recognizable.
- The interaction should feel fast and satisfying.

Future iOS shortcut flow may prefill transaction information, but manual confirmation remains part of the product philosophy.

### 4. Analysis

Primary purpose: answer "where is my money going?"

MVP analysis:
- Spending by category.
- Spending over time.
- Income vs expenses.
- Comparison with previous periods.
- Top merchants.

Avoid excessive charts. Visual clarity is more important than analytical depth.

### 5. Net worth / Accounts

The product should provide a clear view of total money and where it sits.

Supported concepts:
- Bank/cash accounts.
- Investment accounts as a secondary feature.
- Manual balance management.

Investments are not a central investment-management product.

## Data entry

### Manual

Primary method for individual transactions.

### CSV

Secondary method for importing historical or bulk transactions.

### iOS Shortcuts

Future feature. The goal is to make transaction entry much faster without requiring direct bank connections.

### Open Banking

Explicitly out of scope for the foreseeable product direction.

## Internationalization

International from the beginning.

Priority languages:
1. English
2. Spanish
3. French
4. Italian
5. German

The data model and UI must support:
- Multiple currencies.
- Local number formats.
- Local date formats.
- Localized category names.
- Localized merchant/category presentation.

## Explicitly out of scope

- Bank account aggregation.
- Budgets as a core feature.
- Crypto tracking.
- Property/car assets.
- Mortgage/debt management.
- Financial advice.
- Social features.
- Complex investment portfolio management.
- News/content feed.
- AI financial advisor.
- Android app during the initial validation phase.

## MVP success criteria

The MVP is successful if users repeatedly record transactions and return to understand their finances.

Key product signals:
- First transaction completed.
- Five or more transactions recorded.
- User returns after 7 days.
- User returns after 30 days.
- User checks analysis/dashboard repeatedly.
- User imports historical CSV data.

The most important long-term behavioral metric is the percentage of activated users who continue recording expenses after 30 days.

## Product hypothesis

> People who want to manually track their finances will use the product more consistently if the experience is substantially more beautiful and pleasant than traditional expense trackers, while remaining as simple as Monefy.

export type AccountNotice = {
  id?: number
  title: string
  content: string
  publishedAt?: string | null
  read?: boolean
}

export const orderNotice: AccountNotice = {
  title: '订单状态（2.0 功能预告）',
  content: '订单进度、支付状态与退款通知将在 2.0 版本接入。\n\n套餐购买、订单状态、支付记录与退款进度将在订单管理中统一展示，相关消息也会在消息通知中提醒。当前版本暂未开放此功能。',
  read: true,
}

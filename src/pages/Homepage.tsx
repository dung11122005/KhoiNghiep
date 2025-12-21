import { useState } from 'react'
import {
    Row,
    Col,
    Image,
    Typography,
    Card,
    Button,
    Form,
    Input,
    Select,
    Divider,
    message,
    List,
    Modal,
    Radio,
    Space,
} from 'antd'
import product1 from '../assets/product1.jpg'
import product2 from '../assets/product2.jpg'
import product3 from '../assets/product3.jpg'
import product4 from '../assets/product4.jpg'
import product5 from '../assets/product5.jpg'
import product6 from '../assets/product6.jpg'
import product7 from '../assets/product7.jpg'
import product8 from '../assets/product8.jpg'
import product9 from '../assets/product9.jpg'
import product10 from '../assets/product10.jpg'
import product11 from '../assets/product11.jpg'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

type OrderPayload = {
    name: string
    phone: string
    orderType: string
    combo?: string
    address: string
    product: string
    variant?: string
    quantity: number
    note?: string
    image?: string
    date: string
}

const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzddFf0ZKSvEDVIZ0B4m6w7R-8L-BoC7ZsN6rlPT22dQaULXkIiv-Xf5_AJ7lEhsQcgJw/exec'

export default function Homepage() {
    const images = [
        { src: product1, label: 'Bear' },
        { src: product2, label: 'Bọt' },
        { src: product3, label: 'Capybara' },
        { src: product4, label: 'Cv' },
        { src: product5, label: 'Fruit' },
        { src: product6, label: 'Gen' },
        { src: product7, label: 'Khủng Long' },
        { src: product8, label: 'Nice' },
        { src: product9, label: 'Noel' },
        { src: product10, label: 'Panda' },
        { src: product11, label: 'Shin' },
    ]

    const [mainImage, setMainImage] = useState<string>(images[0].src)
    const [selectedVariant, setSelectedVariant] = useState<string>(images[0].label)
    const [quantity, setQuantity] = useState<number>(1)
    const [modalOpen, setModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    const increase = () => setQuantity(q => q + 1)
    const decrease = () => setQuantity(q => Math.max(1, q - 1))

    const openOrderModal = () => {
        setModalOpen(true)
        form.setFieldsValue({ orderType: 'Lẻ' })
    }
    const closeOrderModal = () => setModalOpen(false)

    const onSubmit = async (values: any) => {
        const payload: OrderPayload & { price?: string } = {
            name: values.name,
            phone: values.phone,
            orderType: values.orderType,
            combo: values.combo,
            address: values.address,
            product: 'Pin cài áo - Cá biển',
            variant: selectedVariant,
            quantity,
            note: values.note,
            image: mainImage,
            price: '17500',
            date: new Date().toLocaleString(),
        }
        setLoading(true)
        try {
            const params = new URLSearchParams()
            Object.entries(payload).forEach(([k, v]) => {
                params.append(k, v == null ? '' : String(v))
            })

            const res = await fetch(SHEETS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: params.toString(),
            })
            const json = await res.json().catch(() => ({ status: res.ok ? 'ok' : 'error' }))
            if (res.ok || json.status === 'ok') {
                message.success('Đặt hàng thành công — đã lưu vào Google Sheets.')
                form.resetFields()
                setQuantity(1)
                closeOrderModal()
            } else {
                message.error('Lỗi server: ' + (json.message || 'Không rõ'))
            }
        } catch (err: any) {
            message.error('Không thể gửi đơn: ' + (err.message || err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ padding: 24, background: '#fff' }}>
            <Row gutter={[32, 24]}>
                {/* left gallery */}
                <Col xs={24} md={12}>
                    <Card bordered={false}>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
                            <Image
                                src={mainImage}
                                alt="product"
                                preview={{ src: mainImage }}
                                style={{ maxWidth: 560, borderRadius: 8 }}
                            />
                        </div>

                        <List
                            dataSource={images}
                            grid={{ gutter: 12, column: 5 }}
                            renderItem={(item) => (
                                <List.Item style={{ padding: 6 }}>
                                    <div
                                        onClick={() => {
                                            setMainImage(item.src)
                                            setSelectedVariant(item.label)
                                        }}
                                        style={{
                                            cursor: 'pointer',
                                            border: selectedVariant === item.label ? '2px solid #ff6b6b' : '1px solid #eee',
                                            padding: 2,
                                            borderRadius: 6,
                                            overflow: 'hidden',
                                            background: '#fff',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Image src={item.src} preview={false} width="100%" />
                                        <div style={{ fontSize: 12, padding: '6px 4px' }}>{item.label}</div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* right info */}
                <Col xs={24} md={12}>
                    <div style={{ padding: 8 }}>
                        <Title level={3}>Pin cài áo Cá biển</Title>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                            <Title level={2} style={{ color: '#d4380d', margin: 0 }}>
                                17,500 VND
                            </Title>
                            <Text delete style={{ color: '#888' }}>
                                35,000 VND
                            </Text>
                        </div>

                        <Divider style={{ marginTop: 8 }} />

                        {/* variant grid (larger, selectable boxes) */}
                        <div style={{ marginBottom: 12 }}>
                            <Text strong>Kiểu dáng / Biến thể</Text>
                            <div style={{ marginTop: 8 }}>
                                <List
                                    dataSource={images}
                                    grid={{ gutter: 10, column: 4 }}
                                    renderItem={(it) => (
                                        <List.Item style={{ padding: 0 }}>
                                            <div
                                                onClick={() => {
                                                    setSelectedVariant(it.label)
                                                    setMainImage(it.src)
                                                }}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: selectedVariant === it.label ? '2px solid #ff6b6b' : '1px solid #eee',
                                                    padding: 6,
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    gap: 8,
                                                    alignItems: 'center',
                                                    background: '#fff',
                                                }}
                                            >
                                                <img src={it.src} alt={it.label} style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 4 }} />
                                                <div style={{ fontSize: 13 }}>{it.label}</div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </div>
                        </div>

                        {/* quantity control */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <Text strong>SỐ LƯỢNG</Text>
                            <Space>
                                <Button onClick={decrease}>-</Button>
                                <div style={{ minWidth: 36, textAlign: 'center', border: '1px solid #eee', padding: '6px 8px' }}>{quantity}</div>
                                <Button onClick={increase}>+</Button>
                            </Space>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <Button type="primary" style={{ background: '#4d8bffff', borderColor: '#4d7fffff' }} onClick={openOrderModal}>
                                MUA NGAY
                            </Button>
                        </div>

                        <Divider />

                        <Title level={5}>Giao hàng & Đổi trả</Title>
                        <Paragraph>
                            • Nhận ship hàng nội thành hóa đơn từ 100k, ngoại thành từ 150k.
                            <br />
                            • Đổi trả trong 3 ngày nếu lỗi từ nhà sản xuất.
                            <br />
                            • Không nhận đổi trả với lý do "Không vừa ý".
                        </Paragraph>

                        <Divider />

                        <Paragraph>
                            Mã sản phẩm: <Text strong>PIN51</Text>
                        </Paragraph>
                    </div>
                </Col>
            </Row>

            {/* Modal order form: show selected image + quantity */}
            <Modal title="Đặt hàng - Pin cài áo Cá biển" open={modalOpen} onCancel={closeOrderModal} footer={null}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                    <Image src={mainImage} width={100} alt="selected product" style={{ borderRadius: 6, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Pin cài áo Cá biển</Text>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>{selectedVariant}</Text>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Text> Số lượng: </Text>
                            <div style={{ minWidth: 48, textAlign: 'center', border: '1px solid #eee', padding: '6px 8px', borderRadius: 4 }}>
                                {quantity}
                            </div>
                        </div>
                    </div>
                </div>

                <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ orderType: 'Lẻ' }}>
                    <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Nhập tên' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="orderType" label="Loại" rules={[{ required: true }]}>
                        <Radio.Group>
                            <Radio value="Lẻ">Lẻ</Radio>
                            <Radio value="Combo">Combo</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item shouldUpdate noStyle>
                        {() => {
                            const values = form.getFieldsValue()
                            if (values.orderType === 'Combo') {
                                return (
                                    <Form.Item name="combo" label="Chọn combo" rules={[{ required: true, message: 'Chọn combo' }]}>
                                        <Select>
                                            <Option value="Combo A (3 chiếc)">Combo A (3 chiếc)</Option>
                                            <Option value="Combo B (5 chiếc)">Combo B (5 chiếc)</Option>
                                        </Select>
                                    </Form.Item>
                                )
                            }
                            return null
                        }}
                    </Form.Item>

                    <Form.Item name="address" label="Địa chỉ giao hàng" rules={[{ required: true, message: 'Nhập địa chỉ' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Gửi đơn (lưu vào Google Sheets)
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
        @media (max-width: 768px) {
          .ant-card { padding: 8px; }
        }
      `}</style>
        </div>
    )
}
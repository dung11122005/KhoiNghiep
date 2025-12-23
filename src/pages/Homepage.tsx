import { useState, useEffect, useMemo } from 'react'
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
    Badge,
    Drawer,
    Avatar
} from 'antd'
import { ShoppingCartOutlined, DeleteOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons'

// Import ảnh (giữ nguyên như cũ)
import product1 from '../assets/1. Full Collection Vạn sự như _Boss_.png'
import product2 from '../assets/5. Lộn xộn 1_ 2026.png'
import product3 from '../assets/6. Lộn xộn 2_ Chó.png'
import product4 from '../assets/7. Lộn xộn 3_ Mèo.png'
import product5 from '../assets/8. Lộn xộn 4_ Bánh.png'
import product6 from '../assets/9. Lộn xộn 5_ Bắn.png'
import product7 from '../assets/2. Combo 1_ _Chóa_ sum vầy.png'
import product8 from '../assets/3. Combo 2_ Phát lộc phát mèo.png'
import product9 from '../assets/4. Combo 3_ Tết này ai order_.png'

const { Title, Text } = Typography
const { } = Select

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
type ProductType = {
    id: number
    src: string
    label: string
    price: number
    originalPrice: number
}

type CartItem = ProductType & {
    cartId: string
    quantity: number
}

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
    price: string
}

const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzddFf0ZKSvEDVIZ0B4m6w7R-8L-BoC7ZsN6rlPT22dQaULXkIiv-Xf5_AJ7lEhsQcgJw/exec'

export default function Homepage() {
    // 1. DATA SẢN PHẨM 
    const products: ProductType[] = [
        { id: 1, src: product1, label: 'Vạn sự như Boss', price: 79000, originalPrice: 158000 },
        { id: 2, src: product2, label: 'Mẫu 2026', price: 17000, originalPrice: 34000 },
        { id: 3, src: product3, label: 'Mẫu Chó', price: 17000, originalPrice: 34000 },
        { id: 4, src: product4, label: 'Mẫu Mèo', price: 17000, originalPrice: 34000 },
        { id: 5, src: product5, label: 'Mẫu Bánh', price: 17000, originalPrice: 34000 },
        { id: 6, src: product6, label: 'Mẫu Bắn tim', price: 17000, originalPrice: 34000 },
        { id: 7, src: product7, label: 'Combo Chó sum vầy', price: 49000, originalPrice: 98000 },
        { id: 8, src: product8, label: 'Combo Phát lộc', price: 49000, originalPrice: 98000 },
        { id: 9, src: product9, label: 'Combo Tết order', price: 49000, originalPrice: 98000 },
    ]

    // 2. STATE QUẢN LÝ
    const [selectedProduct, setSelectedProduct] = useState<ProductType>(products[0])
    const [quantityInput, setQuantityInput] = useState<number>(1)
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768) // Check mobile state
    const [form] = Form.useForm()

    // Lắng nghe thay đổi kích thước màn hình
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // --- HELPER FUNCTIONS ---
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

    const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart])
    const cartCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart])

    // --- LOGIC ---
    const addToCart = () => {
        setCart(prev => {
            const existingItemIndex = prev.findIndex(item => item.id === selectedProduct.id)
            if (existingItemIndex > -1) {
                const newCart = [...prev]
                newCart[existingItemIndex].quantity += quantityInput
                return newCart
            } else {
                return [...prev, { ...selectedProduct, quantity: quantityInput, cartId: `${selectedProduct.id}-${Date.now()}` }]
            }
        })
        message.success(`Đã thêm ${quantityInput} ${selectedProduct.label} vào giỏ!`)
        setQuantityInput(1)
    }

    const removeFromCart = (itemId: number) => setCart(prev => prev.filter(item => item.id !== itemId))

    const updateCartQuantity = (itemId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) }
            }
            return item
        }))
    }

    const openCheckoutModal = () => {
        if (cart.length === 0) return message.warning('Giỏ hàng đang trống!')
        setIsCartOpen(false)
        setIsCheckoutModalOpen(true)
        form.setFieldsValue({ orderType: 'Lẻ' })
    }

    const onSubmit = async (values: any) => {
        const productSummary = cart.map(item => `${item.label} (x${item.quantity})`).join(', ')
        const representativeImage = cart[0]?.src || ''

        const payload: OrderPayload = {
            name: values.name,
            phone: values.phone,
            orderType: values.orderType,
            combo: values.combo,
            address: values.address,
            product: productSummary,
            variant: 'Nhiều loại',
            quantity: cartCount,
            note: values.note,
            image: representativeImage,
            price: cartTotal.toString(),
            date: new Date().toLocaleString(),
        }

        setLoading(true)
        try {
            const params = new URLSearchParams()
            Object.entries(payload).forEach(([k, v]) => params.append(k, v == null ? '' : String(v)))
            const res = await fetch(SHEETS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: params.toString(),
            })
            const json = await res.json().catch(() => ({ status: res.ok ? 'ok' : 'error' }))

            if (res.ok || json.status === 'ok') {
                Modal.success({
                    title: 'Đặt hàng thành công',
                    content: 'Chúng tôi sẽ liên hệ bạn sau vài phút nữa.',
                })
                form.resetFields()
                setCart([])
                setIsCheckoutModalOpen(false)
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
        // Padding bottom để chừa chỗ cho thanh menu dính (sticky) trên mobile
        <div style={{ padding: isMobile ? 12 : 24, paddingBottom: isMobile ? 80 : 24, background: '#fff', position: 'relative' }}>

            {/* --- NÚT GIỎ HÀNG NỔI (Giữ nguyên) --- */}
            <div style={{ position: 'fixed', top: isMobile ? 10 : 20, right: isMobile ? 10 : 20, zIndex: 1000 }}>
                <Badge count={cartCount} showZero>
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
                        size="large"
                        style={{ width: 50, height: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        onClick={() => setIsCartOpen(true)}
                    />
                </Badge>
            </div>

            <Row gutter={[32, 24]}>
                {/* TRÁI: ẢNH SẢN PHẨM */}
                <Col xs={24} md={12}>
                    <Card bordered={false} bodyStyle={{ padding: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                            <Image
                                src={selectedProduct.src}
                                alt="product"
                                style={{ width: '100%', maxWidth: 560, borderRadius: 8 }}
                            />
                        </div>
                        {/* List ảnh nhỏ */}
                        <List
                            dataSource={products}
                            grid={{ gutter: 8, xs: 4, sm: 5, md: 5, lg: 5, xl: 5 }}
                            renderItem={(item) => (
                                <List.Item style={{ marginBottom: 8 }}>
                                    <div
                                        onClick={() => setSelectedProduct(item)}
                                        style={{
                                            cursor: 'pointer',
                                            border: selectedProduct.id === item.id ? '2px solid #ff6b6b' : '1px solid #eee',
                                            borderRadius: 6,
                                            overflow: 'hidden',
                                            opacity: selectedProduct.id === item.id ? 1 : 0.6,
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        <Image src={item.src} preview={false} width="100%" />
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* PHẢI: THÔNG TIN */}
                <Col xs={24} md={12}>
                    <div style={{ padding: isMobile ? 0 : 8 }}>
                        <Title level={isMobile ? 4 : 3} style={{ marginBottom: 8 }}>Pin cài áo - {selectedProduct.label}</Title>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                            <Title level={2} style={{ color: '#d4380d', margin: 0 }}>
                                {formatCurrency(selectedProduct.price)}
                            </Title>
                            <Text delete style={{ color: '#888', fontSize: 16 }}>
                                {formatCurrency(selectedProduct.originalPrice)}
                            </Text>
                        </div>

                        <Divider style={{ margin: '12px 0' }} />

                        {/* Chọn biến thể */}
                        <div style={{ marginBottom: 12 }}>
                            <Text strong>Chọn mẫu: <span style={{ color: '#1890ff' }}>{selectedProduct.label}</span></Text>
                            <div style={{ marginTop: 8 }}>
                                <List
                                    dataSource={products}
                                    grid={{ gutter: 8, xs: 3, sm: 4, md: 4 }}
                                    renderItem={(it) => (
                                        <List.Item style={{ padding: 0, marginBottom: 8 }}>
                                            <div
                                                onClick={() => setSelectedProduct(it)}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: selectedProduct.id === it.id ? '2px solid #ff6b6b' : '1px solid #eee',
                                                    padding: 4,
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    background: selectedProduct.id === it.id ? '#fff1f0' : '#fff',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <Avatar src={it.src} shape="square" size={isMobile ? 40 : 50} />
                                                <div style={{ fontSize: 12, marginTop: 4, fontWeight: selectedProduct.id === it.id ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                    {it.label}
                                                </div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </div>
                        </div>

                        {/* --- THANH MUA HÀNG (Đã chuyển vào trong cột này) --- */}
                        <div className="action-bar" style={isMobile ? {
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: '#fff',
                            padding: '12px 16px',
                            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                            zIndex: 999,
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center'
                        } : {
                            // Desktop Styles: Hiển thị ngay tại đây
                            marginTop: 12,
                            marginBottom: 24,
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                            width: '100%'
                        }}>
                            {/* Chọn số lượng */}
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4, height: 44 }}>
                                <Button type="text" onClick={() => setQuantityInput(q => Math.max(1, q - 1))} icon={<MinusOutlined />} style={{ height: '100%' }} />
                                <div style={{ width: 40, textAlign: 'center', fontWeight: 'bold' }}>{quantityInput}</div>
                                <Button type="text" onClick={() => setQuantityInput(q => q + 1)} icon={<PlusOutlined />} style={{ height: '100%' }} />
                            </div>

                            {/* Nút thêm giỏ */}
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                style={{
                                    background: '#4d8bffff',
                                    borderColor: '#4d7fffff',
                                    height: 44,
                                    flex: 1,
                                    fontSize: 16,
                                    fontWeight: 'bold'
                                }}
                                onClick={addToCart}
                            >
                                THÊM VÀO GIỎ
                            </Button>
                        </div>

                        <Divider style={{ margin: '12px 0' }} />

                        {/* Chính sách */}
                        <div style={{ background: '#fafafa', padding: 12, borderRadius: 8 }}>
                            <Text strong>Chính sách giao hàng:</Text>
                            <ul style={{ paddingLeft: 20, margin: '4px 0', fontSize: 13, color: '#666' }}>
                                <li>Ship nội thành 20k, ngoại thành 30k.</li>
                                <li>Đổi trả trong 3 ngày nếu lỗi NSX.</li>
                            </ul>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* --- DRAWER GIỎ HÀNG --- */}
            <Drawer
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Giỏ hàng ({cartCount})</span>
                        <Button type="text" danger onClick={() => setCart([])} size="small">Xóa hết</Button>
                    </div>
                }
                placement="right"
                onClose={() => setIsCartOpen(false)}
                open={isCartOpen}
                width={isMobile ? '85%' : 400}
                footer={
                    <div style={{ padding: '10px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 16, fontWeight: 'bold' }}>
                            <span>Tổng cộng:</span>
                            <span style={{ color: '#d4380d' }}>{formatCurrency(cartTotal)}</span>
                        </div>
                        <Button type="primary" block size="large" onClick={openCheckoutModal} disabled={cart.length === 0} style={{ height: 48 }}>
                            THANH TOÁN
                        </Button>
                    </div>
                }
            >
                {/* Nội dung giỏ hàng */}
                {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>
                        <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                        <p>Chưa có sản phẩm nào</p>
                        <Button onClick={() => setIsCartOpen(false)}>Quay lại mua sắm</Button>
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={cart}
                        renderItem={(item) => (
                            <List.Item actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(item.id)} />]}>
                                <List.Item.Meta
                                    avatar={<Avatar src={item.src} shape="square" size={50} />}
                                    title={<div style={{ fontSize: 14 }}>{item.label}</div>}
                                    description={
                                        <div>
                                            <div style={{ color: '#d4380d', fontWeight: 500 }}>{formatCurrency(item.price * item.quantity)}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                <Button size="small" icon={<MinusOutlined />} onClick={() => updateCartQuantity(item.id, -1)} style={{ width: 24, height: 24, padding: 0 }} />
                                                <span style={{ width: 20, textAlign: 'center', fontSize: 12 }}>{item.quantity}</span>
                                                <Button size="small" icon={<PlusOutlined />} onClick={() => updateCartQuantity(item.id, 1)} style={{ width: 24, height: 24, padding: 0 }} />
                                            </div>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Drawer>

            {/* --- MODAL THANH TOÁN --- */}
            <Modal
                title="Thông tin giao hàng"
                open={isCheckoutModalOpen}
                onCancel={() => setIsCheckoutModalOpen(false)}
                footer={null}
                width={isMobile ? '100%' : 520}
                style={isMobile ? { top: 0, margin: 0, maxWidth: '100%', padding: 0 } : {}}
                bodyStyle={isMobile ? { height: '100vh', overflowY: 'auto' } : {}}
            >
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <Text strong>Đơn hàng ({cartCount} món):</Text>
                    <div style={{ maxHeight: 100, overflowY: 'auto', margin: '8px 0', fontSize: 13, color: '#555' }}>
                        {cart.map(item => (
                            <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.label} (x{item.quantity})</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 16 }}>
                        <span>Thành tiền:</span>
                        <span style={{ color: '#d4380d' }}>{formatCurrency(cartTotal)}</span>
                    </div>
                </div>

                <Form form={form} layout="vertical" onFinish={onSubmit} size="large">
                    <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                        <Input placeholder="Ví dụ: Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}>
                        <Input type="tel" placeholder="09xxxxxxxx" />
                    </Form.Item>
                    <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
                        <Input.TextArea rows={2} placeholder="Số nhà, Đường, Phường..." />
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú (tùy chọn)">
                        <Input.TextArea placeholder="Giao giờ hành chính..." />
                    </Form.Item>

                    <Form.Item name="orderType" initialValue="Lẻ" hidden><Input /></Form.Item>

                    <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48, fontWeight: 'bold' }}>
                        HOÀN TẤT ĐẶT HÀNG
                    </Button>
                </Form>
            </Modal>

            <style>{`
                ::-webkit-scrollbar { width: 4px; height: 4px; }
                ::-webkit-scrollbar-thumb { background: #ccc; borderRadius: 4px; }
            `}</style>
        </div>
    )
}
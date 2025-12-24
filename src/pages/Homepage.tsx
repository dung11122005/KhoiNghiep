import { useState, useEffect, useMemo, useRef } from 'react'
import {
    Row, Col, Image, Typography, Card, Button, Form, Input, Select,
    Divider, message, List, Modal, Badge, Drawer, Avatar, Upload
} from 'antd'
import { ShoppingCartOutlined, DeleteOutlined, PlusOutlined, MinusOutlined, FacebookFilled } from '@ant-design/icons'




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
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [pendingOrderValues, setPendingOrderValues] = useState<any>(null)

    // State cho tính năng kéo thả nút giỏ hàng với snap to edge
    const [cartButtonPosition, setCartButtonPosition] = useState({ x: window.innerWidth - 70, y: isMobile ? 10 : 20, isLeft: false })
    const [isDragging, setIsDragging] = useState(false)
    const [isSnapping, setIsSnapping] = useState(false)
    const cartButtonRef = useRef<HTMLDivElement>(null)
    const dragStartPos = useRef({ x: 0, y: 0, btnX: 0, btnY: 0 })
    const isClickIntent = useRef(true) // Track xem có phải click hay drag

    // Lắng nghe thay đổi kích thước màn hình và điều chỉnh vị trí nút giỏ hàng
    useEffect(() => {
        const handleResize = () => {
            const nowMobile = window.innerWidth < 768
            setIsMobile(nowMobile)
            
            // Điều chỉnh vị trí nút giỏ hàng khi resize
            setCartButtonPosition(prev => {
                const screenWidth = window.innerWidth
                const screenHeight = window.innerHeight
                const buttonWidth = 60
                
                // Kiểm tra xem nút có bị ra ngoài màn hình không
                let newX = prev.x
                let newY = prev.y
                
                // Nếu vượt quá chiều rộng, snap về bên gần nhất
                if (newX > screenWidth - buttonWidth - 10) {
                    newX = screenWidth - buttonWidth - 10
                }
                
                // Nếu vượt quá chiều cao
                const maxY = screenHeight - 100
                if (newY > maxY) {
                    newY = Math.max(10, maxY)
                }
                
                // Snap về bên gần nhất
                const isLeft = newX < screenWidth / 2
                const snapX = isLeft ? 10 : screenWidth - buttonWidth - 10
                
                return { x: snapX, y: newY, isLeft }
            })
        }
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isMobile])

    // Xử lý kéo thả nút giỏ hàng với snap to edge
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            e.preventDefault()
            
            const deltaX = e.clientX - dragStartPos.current.x
            const deltaY = e.clientY - dragStartPos.current.y
            
            // Nếu di chuyển quá 5px thì không phải click nữa
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                isClickIntent.current = false
            }
            
            const newX = dragStartPos.current.btnX + deltaX
            const newY = dragStartPos.current.btnY + deltaY
            
            // Giới hạn trong màn hình
            const maxX = window.innerWidth - 60
            const maxY = window.innerHeight - 60
            
            setCartButtonPosition(prev => ({
                ...prev,
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            }))
        }

        const snapToEdge = (finalX: number, finalY: number) => {
            const screenWidth = window.innerWidth
            const screenHeight = window.innerHeight
            const buttonWidth = 60
            
            // Xác định snap về bên trái hay phải
            const isLeft = finalX < screenWidth / 2
            const snapX = isLeft ? 10 : screenWidth - buttonWidth - 10
            
            // Giới hạn Y trong màn hình
            const maxY = screenHeight - 100 // Để không chặn nút fanpage
            const snapY = Math.max(10, Math.min(finalY, maxY))
            
            setIsSnapping(true)
            setCartButtonPosition({ x: snapX, y: snapY, isLeft })
            
            setTimeout(() => setIsSnapping(false), 300)
        }

        const handleMouseUp = () => {
            if (isDragging) {
                const finalX = cartButtonPosition.x
                const finalY = cartButtonPosition.y
                snapToEdge(finalX, finalY)
            }
            setIsDragging(false)
            // Reset click intent sau một khoảng thời gian ngắn
            setTimeout(() => {
                isClickIntent.current = true
            }, 100)
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || e.touches.length === 0) return
            e.preventDefault()
            
            const touch = e.touches[0]
            const deltaX = touch.clientX - dragStartPos.current.x
            const deltaY = touch.clientY - dragStartPos.current.y
            
            // Nếu di chuyển quá 5px thì không phải click nữa
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                isClickIntent.current = false
            }
            
            const newX = dragStartPos.current.btnX + deltaX
            const newY = dragStartPos.current.btnY + deltaY
            
            // Giới hạn trong màn hình
            const maxX = window.innerWidth - 60
            const maxY = window.innerHeight - 60
            
            setCartButtonPosition(prev => ({
                ...prev,
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            }))
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove, { passive: false })
            document.addEventListener('mouseup', handleMouseUp)
            document.addEventListener('touchmove', handleTouchMove, { passive: false })
            document.addEventListener('touchend', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('touchend', handleMouseUp)
        }
    }, [isDragging, cartButtonPosition.x, cartButtonPosition.y])

    const handleCartButtonMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        isClickIntent.current = true // Reset click intent
        setIsDragging(true)
        setIsSnapping(false)
        dragStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            btnX: cartButtonPosition.x,
            btnY: cartButtonPosition.y
        }
    }

    const handleCartButtonTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 0) return
        e.stopPropagation()
        isClickIntent.current = true // Reset click intent
        setIsDragging(true)
        setIsSnapping(false)
        dragStartPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            btnX: cartButtonPosition.x,
            btnY: cartButtonPosition.y
        }
    }

    const handleCartButtonClick = () => {
        // Chỉ mở giỏ hàng nếu là click (không di chuyển quá 5px)
        if (isClickIntent.current) {
            setIsCartOpen(true)
        }
    }

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
    const [proofImageBase64, setProofImageBase64] = useState<string | null>(null) // state mới nếu dùng upload

    const onSubmit = async (values: any) => {
        const productSummary = cart.map(item => `${item.label} (x${item.quantity})`).join(', ')
        const representativeImage = cart[0]?.src || ''
        const orderIdLocal = `DH${Date.now()}`

        // Lưu tạm thông tin đơn (chưa gửi lên sheet)
        setPendingOrderValues({
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
            orderId: orderIdLocal
        })

        // Tạo QR hiển thị cho khách (chưa gửi sheet)
        try {
            // Tạo QR bằng VietQR API (chắc chắn quét được)
            const amount = cartTotal
            const qrUrl = `https://img.vietqr.io/image/970407-8886756825-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(orderIdLocal)}&accountName=${encodeURIComponent('ÔN GIA CÁT TƯỜNG')}`
            setOrderId(orderIdLocal)
            setQrDataUrl(qrUrl) // dùng URL trực tiếp thay vì toDataURL
            setProofImageBase64(null)
            setIsCheckoutModalOpen(false)
            setPaymentModalOpen(true)
        } catch (e) {
            message.error('Không thể tạo QR. Vui lòng thử lại.')
        }
    }


    const finalizeOrder = async () => {
        if (!pendingOrderValues || !orderId) {
            return message.error('Thiếu thông tin đơn.')
        }
        if (!proofImageBase64) {
            return message.warning('Vui lòng tải ảnh chứng từ trước khi hoàn tất.')
        }

        setLoading(true)
        try {
            const payload: any = { ...pendingOrderValues }

            // Tách base64 data và mime type
            const base64Data = proofImageBase64.includes(',')
                ? proofImageBase64.split(',')[1]
                : proofImageBase64;

            const mimeMatch = proofImageBase64.match(/^data:(.*?);base64,/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/png';

            payload.proofImageBase64 = base64Data;
            payload.proofImageMime = mime;

            // DEBUG Console
            console.log('=== DEBUG INFO ===');
            console.log('Base64 length:', base64Data.length);
            console.log('MIME type:', mime);
            console.log('First 100 chars:', base64Data.substring(0, 100));
            console.log('Order ID:', orderId);

            const params = new URLSearchParams()
            Object.entries(payload).forEach(([k, v]) => {
                if (v != null) {
                    params.append(k, String(v))
                }
            })

            console.log('Total payload size:', params.toString().length, 'bytes');

            const res = await fetch(SHEETS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: params.toString(),
            })

            const responseText = await res.text();
            console.log('Response status:', res.status);
            console.log('Response body:', responseText);

            const json = JSON.parse(responseText);

            if (res.ok && json.status === 'ok') {
                Modal.success({
                    title: 'Đặt hàng thành công!',
                    content: (
                        <div>
                            <p>Cảm ơn bạn đã đặt hàng.</p>
                            <p><strong>Mã đơn:</strong> {orderId}</p>
                            <p>Chúng tôi sẽ liên hệ bạn sau vài phút nữa.</p>
                            {json.proofFileUrl && json.proofFileUrl !== '' && !json.proofFileUrl.startsWith('ERROR') && (
                                <p style={{ fontSize: 12, color: '#52c41a', marginTop: 8 }}>
                                    ✓ Ảnh chứng từ đã lưu
                                </p>
                            )}
                            {json.proofFileUrl && json.proofFileUrl.startsWith('ERROR') && (
                                <p style={{ fontSize: 12, color: '#ff4d4f', marginTop: 8 }}>
                                    ⚠ Lỗi lưu ảnh: {json.proofFileUrl}
                                </p>
                            )}
                        </div>
                    ),
                    onOk: () => {
                        form.resetFields()
                        setCart([])
                        setPaymentModalOpen(false)
                        setOrderId(null)
                        setQrDataUrl(null)
                        setPendingOrderValues(null)
                        setProofImageBase64(null)
                    }
                })
            } else {
                message.error('Lỗi server: ' + (json.message || 'Không rõ'))
                console.error('Server error:', json);
            }
        } catch (err: any) {
            console.error('Client error:', err);
            message.error('Không thể gửi đơn: ' + (err.message || err))
        } finally {
            setLoading(false)
        }
    }

    return (
        // Padding bottom để chừa chỗ cho thanh menu dính (sticky) trên mobile
        <div style={{ padding: isMobile ? 12 : 24, paddingBottom: isMobile ? 80 : 24, background: '#fff', position: 'relative' }}>

            {/* --- NÚT GIỎ HÀNG NỔI (CÓ KÉO THẢ VÀ SNAP TO EDGE) --- */}
            <div
                ref={cartButtonRef}
                onMouseDown={handleCartButtonMouseDown}
                onTouchStart={handleCartButtonTouchStart}
                style={{
                    position: 'fixed',
                    top: cartButtonPosition.y,
                    left: cartButtonPosition.x,
                    zIndex: 1000,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: isSnapping || !isDragging ? 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'none'
                }}
            >
                <Badge count={cartCount} showZero>
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
                        size="large"
                        style={{ 
                            width: 50, 
                            height: 50, 
                            boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
                            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                            pointerEvents: 'auto'
                        }}
                        onClick={handleCartButtonClick}
                    />
                </Badge>
            </div>

            {/* --- NÚT LIÊN HỆ FANPAGE --- */}
            <a
                href="https://www.facebook.com/profile.php?id=61569671987897"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    position: 'fixed',
                    bottom: isMobile ? 80 : 20,
                    right: isMobile ? 10 : 20,
                    zIndex: 999,
                    textDecoration: 'none'
                }}
            >
                <Button
                    type="primary"
                    size="large"
                    style={{
                        background: '#1877f2',
                        borderColor: '#1877f2',
                        boxShadow: '0 4px 12px rgba(24, 119, 242, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: isMobile ? '8px 12px' : '12px 16px',
                        height: 'auto',
                        borderRadius: 25,
                        fontWeight: 'bold',
                        fontSize: isMobile ? 12 : 14
                    }}
                >
                    <FacebookFilled style={{ fontSize: isMobile ? 20 : 24 }} />
                    Liên hệ ngay
                </Button>
            </a>

            <Row gutter={[32, 24]}>
                {/* TRÁI: ẢNH SẢN PHẨM */}
                <Col xs={24} md={12}>
                    <Card bordered={false} bodyStyle={{ padding: isMobile ? 8 : 0 }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            marginBottom: 16,
                            background: '#f5f5f5',
                            borderRadius: 8,
                            padding: isMobile ? 8 : 16
                        }}>
                            <Image
                                src={selectedProduct.src}
                                alt="product"
                                style={{ 
                                    width: '100%', 
                                    maxWidth: isMobile ? '100%' : 560, 
                                    borderRadius: 8,
                                    objectFit: 'contain'
                                }}
                                preview={{
                                    mask: <div>Xem lớn</div>
                                }}
                            />
                        </div>
                        {/* List ảnh nhỏ - horizontal scroll */}
                        <div style={{ 
                            display: 'flex', 
                            gap: 8, 
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            paddingBottom: 8,
                            scrollbarWidth: 'thin'
                        }}>
                            {products.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedProduct(item)}
                                    style={{
                                        cursor: 'pointer',
                                        border: selectedProduct.id === item.id ? '2px solid #ff6b6b' : '1px solid #eee',
                                        borderRadius: 6,
                                        overflow: 'hidden',
                                        opacity: selectedProduct.id === item.id ? 1 : 0.6,
                                        transition: 'all 0.2s',
                                        flexShrink: 0,
                                        width: isMobile ? 60 : 80,
                                        height: isMobile ? 60 : 80
                                    }}
                                >
                                    <Image 
                                        src={item.src} 
                                        preview={false} 
                                        width="100%" 
                                        height="100%"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                            ))}
                        </div>
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
                                    grid={{ gutter: 8, xs: 3, sm: 3, md: 4, lg: 4 }}
                                    renderItem={(it) => (
                                        <List.Item style={{ padding: 0, marginBottom: 8 }}>
                                            <div
                                                onClick={() => setSelectedProduct(it)}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: selectedProduct.id === it.id ? '2px solid #ff6b6b' : '1px solid #eee',
                                                    padding: isMobile ? 3 : 4,
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    background: selectedProduct.id === it.id ? '#fff1f0' : '#fff',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <Avatar src={it.src} shape="square" size={isMobile ? 36 : 50} />
                                                <div style={{ 
                                                    fontSize: isMobile ? 10 : 12, 
                                                    marginTop: 4, 
                                                    fontWeight: selectedProduct.id === it.id ? 'bold' : 'normal', 
                                                    whiteSpace: 'nowrap', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    width: '100%' 
                                                }}>
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
                width={isMobile ? '90%' : 400}
                footer={
                    <div style={{ padding: '10px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: isMobile ? 15 : 16, fontWeight: 'bold' }}>
                            <span>Tổng cộng:</span>
                            <span style={{ color: '#d4380d' }}>{formatCurrency(cartTotal)}</span>
                        </div>
                        <Button 
                            type="primary" 
                            block 
                            size={isMobile ? 'middle' : 'large'} 
                            onClick={openCheckoutModal} 
                            disabled={cart.length === 0} 
                            style={{ height: isMobile ? 42 : 48 }}
                        >
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

            <Modal
                title="Thanh toán - Quét QR và tải ảnh chứng từ"
                open={paymentModalOpen}
                onCancel={() => setPaymentModalOpen(false)}
                footer={null}
                width={isMobile ? '95%' : 520}
                style={isMobile ? { top: 20 } : {}}
            >
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: isMobile ? 13 : 14 }}>Quét mã dưới đây để chuyển khoản hoặc dùng phương thức chuyển khoản tay.</p>
                    {qrDataUrl ? (
                        <img 
                            src={qrDataUrl} 
                            alt="QR thanh toán" 
                            style={{ 
                                width: isMobile ? '100%' : 260, 
                                maxWidth: 260,
                                height: 'auto' 
                            }} 
                        />
                    ) : (
                        <div>Đang tạo QR...</div>
                    )}
                    <div style={{ marginTop: 8, fontSize: isMobile ? 12 : 14 }}>
                        <div><strong>Mã đơn:</strong> {orderId}</div>
                        <div><strong>Số tiền:</strong> {formatCurrency(cartTotal)}</div>
                        <div><strong>Chủ TK:</strong> ÔN GIA CÁT TƯỜNG</div>
                        <div><strong>STK:</strong> 8886756825</div>
                    </div>

                    <div style={{ marginTop: 12, textAlign: 'left' }}>
                        <div style={{ marginBottom: 8, fontSize: isMobile ? 13 : 14 }}><strong>Ảnh chứng từ (bắt buộc):</strong></div>
                        <Upload
                            beforeUpload={(file) => {
                                const reader = new FileReader()
                                reader.onload = () => setProofImageBase64(String(reader.result))
                                reader.readAsDataURL(file)
                                return false
                            }}
                            maxCount={1}
                            accept="image/*"
                            showUploadList={{ showRemoveIcon: true }}
                            onRemove={() => setProofImageBase64(null)}
                        >
                            <Button size={isMobile ? 'middle' : 'large'}>Chọn ảnh</Button>
                        </Upload>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <Button 
                            type="primary" 
                            onClick={finalizeOrder} 
                            loading={loading} 
                            disabled={!proofImageBase64} 
                            style={{ minWidth: isMobile ? '100%' : 180 }}
                            size={isMobile ? 'middle' : 'large'}
                        >
                            HOÀN TẤT ĐẶT HÀNG
                        </Button>
                    </div>
                </div>
            </Modal>

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
                        ĐẶT HÀNG
                    </Button>
                </Form>
            </Modal>

            <style>{`
                ::-webkit-scrollbar { width: 4px; height: 4px; }
                ::-webkit-scrollbar-thumb { background: #ccc; borderRadius: 4px; }
                
                /* Horizontal thumbnail scroll */
                div::-webkit-scrollbar {
                    height: 6px;
                }
                
                div::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                div::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }
                
                div::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                
                /* Smooth drag animation */
                @keyframes bounce-in {
                    0% { transform: scale(0.95); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                /* Responsive improvements */
                @media (max-width: 768px) {
                    .ant-modal {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .ant-drawer-body {
                        padding: 12px !important;
                    }
                    
                    .ant-image {
                        max-height: 400px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .ant-card-body {
                        padding: 12px !important;
                    }
                    
                    .ant-typography {
                        font-size: 14px !important;
                    }
                    
                    .ant-btn-lg {
                        height: 40px !important;
                        font-size: 14px !important;
                    }
                    
                    .ant-image {
                        max-height: 300px !important;
                    }
                }
                
                /* Fix cho mobile landscape */
                @media (max-height: 500px) and (orientation: landscape) {
                    .action-bar {
                        position: relative !important;
                    }
                }
                
                /* Desktop: ảnh to hơn */
                @media (min-width: 1024px) {
                    .ant-image {
                        max-height: 600px !important;
                    }
                }
            `}</style>
        </div>
    )
}
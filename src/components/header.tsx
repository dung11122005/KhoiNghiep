import { Layout, Row, Col, Button } from 'antd'
import logo from '../assets/istockphoto-1204131571-612x612.jpg'

const { Header } = Layout

export default function AppHeader() {
    return (
        <Header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                background: 'linear-gradient(90deg,#2ecc71,#1abc9c)',
                padding: '8px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
        >
            <Row align="middle" justify="space-between" style={{ minHeight: 56 }}>
                <Col>
                    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                        <img src={logo} alt="logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6 }} />
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>OCSEN Shop</div>
                    </a>
                </Col>

                <Col flex="auto" style={{ textAlign: 'center' }} className="header-greeting">
                    <div style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                        Chào mừng đến OCSEN — Pin cài áo chất lượng, đặt hàng nhanh
                    </div>
                </Col>
            </Row>

            <style>{`
        /* Responsive cho header */
        @media (max-width: 1024px) {
          .header-greeting { 
            font-size: 14px !important; 
          }
        }
        
        /* tablet/phone: ẩn câu chào, chỉ hiện logo + tên + SDT */
        @media (max-width: 900px) {
          .header-greeting { display: none !important; }
          .ant-layout-header { padding: 8px 12px; }
          .ant-layout-header img { width: 36px; height: 36px; }
        }
        
        @media (max-width: 480px) {
          .ant-layout-header a { gap: 8px; }
          .ant-layout-header a > div { font-size: 16px !important; }
        }
        
        @media (max-width: 360px) {
          .ant-layout-header a > div { font-size: 14px !important; }
          .ant-layout-header img { width: 32px; height: 32px; }
        }
      `}</style>
        </Header>
    )
}
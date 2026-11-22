import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Avatar, CircularProgress, Alert, InputAdornment, IconButton, Fade, Stack, Divider } from '@mui/material';
import { LockOutlined, EmailOutlined, Visibility, VisibilityOff, DashboardCustomize } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { login, isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isAuthenticated) { navigate('/'); }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setLocalError('');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }
    const result = await login(formData.email, formData.password);
    if (result.success) { navigate('/');
    } else { setLocalError('Login failed. Please try again.'); }
  };

  const pageGradient = isDark
    ? 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0f3460 100%)'
    : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%)';

  const paperBg = isDark ? 'rgba(20, 20, 40, 0.92)' : 'rgba(255, 255, 255, 0.95)';
  const paperBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(102, 126, 234, 0.25)';
  const paperShadow = isDark
    ? '0 8px 32px rgba(0,0,0,0.45)'
    : '0 12px 40px rgba(102, 126, 234, 0.18)';

  const bubble1 = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(102, 126, 234, 0.08)';
  const bubble2 = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(118, 75, 162, 0.06)';

  const autofillTextColor = isDark ? '#ffffff' : theme.palette.text.primary;

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      transition: 'all 0.2s',
      '&:hover': { boxShadow: `0 0 0 2px ${isDark ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.15)'}` },
      '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
        WebkitBoxShadow: `0 0 0 1000px ${isDark ? 'transparent' : '#ffffff'} inset`,
        WebkitTextFillColor: autofillTextColor,
        caretColor: autofillTextColor,
        transition: 'background-color 9999s ease-out 0s',
      },
    },
  };
  return (
    <Box
      sx={{
        minHeight: '100vh',display: 'flex', alignItems: 'center',
        background: pageGradient,
        py: 4, position: 'relative', overflow: 'hidden',
         transition: 'background 0.3s ease',
      }} >
      <Box
        sx={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          borderRadius: '50%', background: bubble1, pointerEvents: 'none'
        }} />
      <Box
        sx={{
          position: 'absolute', bottom: -150, left: -150, width: 500, height: 500,
          borderRadius: '50%', background: bubble2, pointerEvents: 'none'
        }} />
      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 5 }, borderRadius: 4, background: paperBg ,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${paperBorder}`,boxShadow: paperShadow, position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease',
            }} >
            <Box
              sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                background: 'linear-gradient(90deg, #667eea, #764ba2, #667eea)',
                backgroundSize: '200% 100%',
                animation: 'gradientMove 3s ease-in-out infinite',
                '@keyframes gradientMove': {
                  '0%': { backgroundPosition: '0% 0%' },
                  '50%': { backgroundPosition: '100% 0%' },
                  '100%': { backgroundPosition: '0% 0%' }
                }
              }}
            />
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'center', mb: 2 }} >
                <Avatar
                  sx={{
                    width: 90, height: 90, bgcolor: 'primary.main',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.05) rotate(-5deg)' }
                  }} >
                  <DashboardCustomize sx={{ fontSize: 48 }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4" component="h1" fontWeight="800"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px'
                }} >
                SPICE DIRECT WHOLESALE
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }} >
                Sign in to your account
              </Typography>
            </Box>
            {(localError) && (
              <Fade in>
                <Alert
                  severity="error"
                  sx={{
                    mb: 3, borderRadius: 2,
                    '& .MuiAlert-icon': { fontSize: 20 }
                  }} >
                  {localError}
                </Alert>
              </Fade>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"> <EmailOutlined color="action" sx={{ fontSize: 20 }} /> </InputAdornment>
                  )
                }}
                sx={{ mb: 2.5, ...textFieldSx  }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"> <LockOutlined color="action" sx={{ fontSize: 20 }} /> </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3.5, ...textFieldSx }} />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                sx={{
                  py: 1.8, borderRadius: 2,
                  fontSize: '1rem', fontWeight: 600, textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: isHovered 
                    ? '0 8px 32px rgba(102, 126, 234, 0.5)' 
                    : '0 4px 16px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.5)'
                  },
                  '&:active': { transform: 'translateY(0)' },
                  transition: 'all 0.3s ease'
                }} >
                {isLoading ? ( <CircularProgress size={26} color="inherit" /> ) : ( 'Sign In' )}
              </Button>
              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary"> Secure Login </Typography>
              </Divider>
              <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 1 }} >
                <Typography variant="caption" color="text.secondary"> © {new Date().getFullYear()} Spice Direct Wholesale </Typography>
              </Stack>
            </form>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
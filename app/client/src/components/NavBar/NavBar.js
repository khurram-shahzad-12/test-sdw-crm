import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Link, useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import { menuItems } from '../../configs/NavBarMenuItems';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, CssBaseline, Typography, Box, AppBar, Avatar, Tooltip, Paper } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import { styled, alpha, useTheme } from '@mui/material/styles';
import Profile from "../Profile/Profile";
import logo from "../../resources/spicedirect_logo.png";
import styles from "./styles.module.css";
import { useAuth } from '../../contexts/AuthContext';
import Cookies from 'universal-cookie';
import SettingsModal from "../SettingsModal/SettingsModal";
import jwtDecode from "jwt-decode";
import { useIdleTimer } from 'react-idle-timer'
import { io } from 'socket.io-client';
import { URL_ROOT } from "../../configs/config";
import { Chat, Token } from '@mui/icons-material';
import Badge from '@mui/material/Badge';
import ChatDialog from '../ChatDialog/ChatDialog';
import { useChatSocket } from '../hooks/useChatSocket';
import testLogo from "../../resources/testserver_logo.jpeg";

const drawerWidth = 260;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        height: "100%",
        flexGrow: 1,
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: `-${drawerWidth}px`,
        ...(open && {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        }),
    }),
);

const getLogoDivStyles = (theme) => ({
    height: "110px",
    minHeight: "110px",
    padding: "8px 12px",
    background: theme.palette.mode === "dark"
        ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
        : `linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}));
const StyledAppBar = styled(AppBar)(({ theme, open }) => ({
    background: theme.palette.mode === "dark"
        ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
        : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    color: theme.palette.mode === "dark"
        ? theme.palette.text.primary
        : theme.palette.primary.contrastText,
    boxShadow: theme.palette.mode === "dark"
        ? "0 4px 20px rgba(0,0,0,0.5)"
        : "0 4px 20px rgba(0,0,0,0.15)",
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));
const StyledDrawer = styled(Drawer)(({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        background: theme.palette.mode === "dark"
            ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(180deg, #fafbfc 0%, #f0f2f5 100%)`,
        color: theme.palette.text.primary,
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === "dark"
            ? "2px 0 12px rgba(0,0,0,0.4)"
            : "2px 0 12px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
    },
}));
const MenuListItemButton = styled(ListItemButton)(({ theme }) => ({
    borderRadius: "10px",
    margin: "2px 10px",
    padding: "10px 14px",
    color: theme.palette.text.primary,
    transition: "all 0.2s ease",
    "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.08),
        transform: "translateX(4px)",
    },
    "&.Mui-selected": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.24 : 0.12),
        color: theme.palette.primary.main,
        "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.3 : 0.18),
        },
    },
}));
const SubMenuListItemButton = styled(ListItemButton)(({ theme }) => ({
    borderRadius: "8px",
    margin: "1px 10px 1px 22px",
    padding: "8px 12px",
    color: theme.palette.text.primary,
    transition: "all 0.2s ease",
    "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.08),
        transform: "translateX(3px)",
    },
}));
const GradientDivider = styled(Divider)(({ theme }) => ({
    margin: "8px 16px",
    background: theme.palette.mode === "dark"
        ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)"
        : "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)",
    border: "none",
    height: "1px",
}));
const NavBar = (props) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, logout, user, token, hasPermission } = useAuth();
    const [collapseStates, setCollapseStates] = useState({});
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [userPermissions, setUserPermissions] = useState(null);
    const [state, setState] = useState('Active');
    const [remaining, setRemaining] = useState(0);
    const [socketIO, setSocketIO] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesOpen, setMessagesOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);
    const [unreadMap, setUnreadMap] = useState({});
    const [hasMore, setHasMore] = useState(true);
    const [offlineMessagesMap, setOfflineMessagesMap] = useState({});
    const [loadingMore, setLoadingMore] = useState(false);
    const [inactiveUsersWithMessages, setInactiveUsersWithMessages] = useState([]);
    const [otherUsers, setOtherUsers] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [replyTo, setReplyTo] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const audioRef = useRef(null)
    const cookies = useMemo(() => new Cookies(), []);

    const hasMenuPermission = useCallback((requiredPermissions) => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        return requiredPermissions.some(perm => {
            if (typeof perm === 'string') {
                return hasPermission(perm);
            }
            return false;
        });
    }, [hasPermission]);

    useEffect(() => {
        if (!isAuthenticated || !token) return;
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;
        if (isAuthenticated && token) {
            const socket = io(URL_ROOT, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                timeout: 120000,
                closeOnBeforeunload: false,
            });
            socket.on("connect", () => {
                socket.emit("REGISTER", [userId, token]);
                socket.emit("GET_ALL_USERS")
            });
            socket.on("LOGOUT", () => {
                socket.disconnect();
                logout();
            });
            setSocketIO(socket);

            return () => {
                socket.disconnect();
            };
        }
    }, [isAuthenticated, token, logout]);

    useChatSocket({
        socketIO,
        cookies,
        isAuthenticated,
        messagesOpen,
        selectedUser,
        offlineMessagesMap,
        loadingMore,
        setMessages,
        setUnreadMap,
        setActiveUsers,
        setAllUsers,
        setOfflineMessagesMap,
        setHasMore,
        setLoadingMore,
        messagesEndRef,
        audioRef,
        soundEnabled,
    });

    const onIdle = () => {
        setState('Idle');
        isAuthenticated && logout();
    }

    const onActive = () => {
        setState('Active');
    }

    const { getRemainingTime } = useIdleTimer({
        onIdle,
        onActive,
        timeout: process.env.REACT_APP_INACTIVITY_TIMEOUT_MILLISECONDS,
        crossTab: true,
        leaderElection: true,
        syncTimers: 200
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(Math.ceil(getRemainingTime() / 1000))
        }, 500)

        return () => {
            clearInterval(interval)
        }
    })

    const logoutUser = async () => {
       if (socketIO) {
        try {
            if (socketIO.connected) {
                socketIO.emit("USER_LOGOUT");
            }
            socketIO.disconnect();
        } catch (error) {
            console.log('Socket disconnect error (ignored):', error);
        }
        setSocketIO(null); // Clear socket state
    }
        await logout();
        navigate('/login');

    }

    const handleClick = (name) => {
        setCollapseStates(prev => ({
            ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
            [name]: !prev[name]
        }));
    };

    const handleDrawerOpen = () => {
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
    };

    const sendMessage = useCallback(() => {
        if (!socketIO || !newMessage.trim() || !selectedUser) return;
        const fromUser = jwtDecode(cookies.get("apitoken")).id;
        const msgObj = { senderId: fromUser, receiverId: selectedUser, message: newMessage.trim(), replyTo: replyTo?._id || null };
        socketIO.emit("PRIVATE_MESSAGE", msgObj);
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100);
        setNewMessage("");
        setReplyTo(null)

    }, [socketIO, newMessage, selectedUser, cookies])

    const categorizeUsers = useCallback((userList, offlineMsgMap) => {
        const myUserId = cookies.get("apitoken") ? jwtDecode(cookies.get("apitoken"))?.id : null;
        if (!myUserId) return { active: [], inactiveWithMessages: [], other: [] };
        const filteredList = userList.filter(user => user.id !== myUserId);
        const active = filteredList.filter(user => user.online === true);
        const inactiveWithMessages = filteredList.filter(user => {
            if (user.online === true) return false;
            return offlineMsgMap[user.id] && offlineMsgMap[user.id].length > 0;
        });
        const other = filteredList.filter(user => {
            if (user.online === true) return false;
            if (inactiveWithMessages.some(u => u.id === user.id)) return false;
            return true;
        });
        return { active, inactiveWithMessages, other };
    }, [cookies]);

    const handleSelectedUser = useCallback((userId) => {
        if (!userId, !socketIO) return;
        setSelectedUser(userId);
        setMessages([]);
        setHasMore(true);
        socketIO.emit("CHAT_OPENED", { withUser: userId })
        setUnreadMap(prev => {
            const copy = { ...prev };
            delete copy[userId]; return copy;
        })
        socketIO.emit("LOAD_CHAT", { withUser: userId });
    }, [socketIO]);

    const loadMoreMessages = useCallback(() => {
        if (!socketIO || !selectedUser || !hasMore || loadingMore) return;
        const oldestMessage = messages[0];
        if (!oldestMessage) return;
        socketIO.emit("LOAD_CHAT", { withUser: selectedUser, before: oldestMessage.createdAt });
    }, [socketIO, selectedUser, hasMore, loadingMore, messages])
    const totalUnread = Object.keys(unreadMap).length;

    useEffect(() => {
        if (messagesOpen && selectedUser) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, messagesOpen, selectedUser]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || !selectedUser) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && hasMore && !loadingMore) {
                setLoadingMore(true);
                loadMoreMessages();
            }
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadingMore, loadMoreMessages, selectedUser]);

    useEffect(() => {
        if (allUsers.length > 0) {
            const { inactiveWithMessages, other } = categorizeUsers(
                allUsers,
                offlineMessagesMap,
            );
            setInactiveUsersWithMessages(inactiveWithMessages);
            setOtherUsers(other);
        }
    }, [allUsers, offlineMessagesMap, categorizeUsers]);

    useEffect(() => {
        const notificationSound = new Audio('/notification.mp3');
        notificationSound.preload = 'auto';
        notificationSound.volume = 0.8;
        audioRef.current = notificationSound;
        return () => {
            if (notificationSound) {
                notificationSound.pause();
                notificationSound.currentTime = 0;
            }
        }
    }, [])
    return <Box sx={{ display: 'flex', height: "100%" }}>
        <CssBaseline />
        <StyledAppBar position="fixed" open={drawerOpen} elevation={0}>
            <Toolbar sx={{ minHeight: "64px !important" }}>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    edge="start"
                    sx={{
                            mr: 2,
                            ...(drawerOpen && { display: 'none' }),
                            borderRadius: "10px",
                            "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.1) }
                        }}
                >
                    <MenuIcon />
                </IconButton>
                <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: isAuthenticated ? theme.palette.success.main : theme.palette.error.main,
                                boxShadow: isAuthenticated
                                    ? `0 0 8px ${theme.palette.success.main}`
                                    : `0 0 8px ${theme.palette.error.main}`,
                                animation: isAuthenticated ? "pulse 2s infinite" : "none",
                                "@keyframes pulse": {
                                    "0%": { opacity: 1 },
                                    "50%": { opacity: 0.5 },
                                    "100%": { opacity: 1 },
                                },
                            }}
                        />
                        <Typography
                            variant="h6"
                            noWrap
                            component="div"
                            sx={{
                                fontWeight: 700,
                                letterSpacing: "0.5px",
                                fontSize: "1.1rem",
                                color: "inherit",
                            }}
                        >
                            SPICE DIRECT WHOLESALE LTD
                        </Typography>
                    </Box>
                <Tooltip title="Settings" arrow>
                        <IconButton
                            onClick={() => setSettingsOpen(true)}
                            sx={{
                                mr: 2,
                                color: "inherit",
                                opacity: 0.85,
                                borderRadius: "10px",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                    opacity: 1,
                                    transform: "rotate(45deg)",
                                },
                            }}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                {settingsOpen && <SettingsModal userPreferences={props.userPreferences} updateUserPreferences={props.updateUserPreferences} handleClose={() => setSettingsOpen(false)} />}
                {
                    isAuthenticated &&
                    <Button
                            variant="contained"
                            onClick={logoutUser}
                            endIcon={<LogoutIcon />}
                            sx={{
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 600,
                                px: 2.5,
                                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                color: theme.palette.error.contrastText,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    background: `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`,
                                    boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.45)}`,
                                    transform: "translateY(-1px)",
                                },
                            }}
                        >
                            LOGOUT
                        </Button>
                }

            </Toolbar>
        </StyledAppBar>
        <StyledDrawer
                variant="persistent"
                anchor="left"
                open={drawerOpen}
            >
                <div style={getLogoDivStyles(theme)}>
                    <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", height: "100%", "&:hover": {cursor:"pointer", opacity: 0.85} }} onClick={() => navigate('/')}>
                        <img
                            src={process.env.REACT_APP_TYPE === "development" ? testLogo : logo}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                                filter: theme.palette.mode === "dark" ? "brightness(1.15)" : "none",
                            }}
                            alt="Spice Direct Logo"
                        />
                    </Box>
                    <IconButton
                        onClick={handleDrawerClose}
                        sx={{
                            borderRadius: "10px",
                            color: "text.primary",
                            backgroundColor: alpha(theme.palette.text.primary, 0.04),
                            "&:hover": { backgroundColor: alpha(theme.palette.text.primary, 0.08) },
                        }}
                    >
                        {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </div>
                <GradientDivider />
                <Profile />
                {
                    process.env.REACT_APP_TYPE === "development" ?
                        <Paper
                            elevation={0}
                            sx={{
                                mx: 2,
                                mb: 1,
                                py: 0.75,
                                textAlign: "center",
                                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                borderRadius: "10px",
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{ color: theme.palette.error.contrastText, fontWeight: 700, letterSpacing: "1px" }}
                            >
                                ⚠ TESTING MODE
                            </Typography>
                        </Paper>
                        :
                        <></>
                }
                <GradientDivider />
                <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 0.5 }}>
                    {isAuthenticated ?
                        <div>
                            {menuItems.map(parentItem => {
                                const hasParentAccess = hasMenuPermission(parentItem.requiredPermissions);
                                if (!hasParentAccess) return null;
                                const accessibleSubItems = parentItem.subItems?.filter(subItem => hasMenuPermission(subItem.requiredPermissions)) || [];
                                if (accessibleSubItems.length === 0) return null;
                                const isExpanded = collapseStates[parentItem.name];
                                return (
                                    <React.Fragment key={parentItem.name}>
                                        <MenuListItemButton
                                            onClick={event => handleClick(parentItem.name)}
                                            selected={isExpanded}
                                        >
                                            <ListItemIcon sx={{ minWidth: "40px", color: isExpanded ? "primary.main" : "text.secondary" }}>
                                                {parentItem.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={parentItem.name}
                                                primaryTypographyProps={{
                                                    fontSize: "0.9rem",
                                                    fontWeight: isExpanded ? 600 : 500,
                                                }}
                                            />
                                            {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                        </MenuListItemButton>
                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                            {
                                                accessibleSubItems.map(subItem => (
                                                    <List component="div" disablePadding key={subItem.name}>
                                                        <Link
                                                            to={`../${parentItem.name}/${subItem.name}`}
                                                            className={theme.palette.mode === "dark" ? styles.linkDark : styles.linkLight}
                                                            style={{ textDecoration: "none", color: "inherit" }}
                                                        >
                                                            <SubMenuListItemButton>
                                                                <ListItemIcon sx={{ minWidth: "36px", color: "text.secondary" }}>
                                                                    {subItem.icon}
                                                                </ListItemIcon>
                                                                <ListItemText
                                                                    primary={subItem.label}
                                                                    primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}
                                                                />
                                                            </SubMenuListItemButton>
                                                        </Link>
                                                    </List>
                                                ))
                                            }
                                        </Collapse>
                                    </React.Fragment>
                                )
                            }
                            )}
                            <GradientDivider />
                            <MenuListItemButton onClick={() => { setMessagesOpen(true); }}>
                                <ListItemIcon sx={{ minWidth: "40px", color: totalUnread > 0 ? "error.main" : "text.secondary" }}>
                                    <Badge badgeContent={totalUnread} color='error'>
                                        <Chat />
                                    </Badge>
                                </ListItemIcon>
                                <ListItemText
                                    primary='Messages'
                                    primaryTypographyProps={{
                                        fontSize: "0.9rem",
                                        fontWeight: totalUnread > 0 ? 600 : 500,
                                    }}
                                />
                                {totalUnread > 0 && (
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            backgroundColor: "error.main",
                                            animation: "pulse 2s infinite",
                                            "@keyframes pulse": {
                                                "0%": { opacity: 1 },
                                                "50%": { opacity: 0.5 },
                                                "100%": { opacity: 1 },
                                            },
                                        }}
                                    />
                                )}
                            </MenuListItemButton>
                        </div>
                        :
                        <List component="div" disablePadding>
                            <MenuListItemButton disabled={isLoading}>
                                <ListItemIcon sx={{ minWidth: "40px" }}>
                                    <LoginIcon />
                                </ListItemIcon>
                                <ListItemText primary="Login" primaryTypographyProps={{ fontSize: "0.9rem" }} />
                            </MenuListItemButton>
                        </List>
                    }
                </Box>
                <GradientDivider />
            </StyledDrawer>

        <Main open={drawerOpen}>
            <DrawerHeader />
            {props.renderComponent}
        </Main>
        <ChatDialog
            messagesOpen={messagesOpen}
            setMessagesOpen={setMessagesOpen}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            messages={messages}
            setMessages={setMessages}
            hasMore={hasMore}
            setHasMore={setHasMore}
            loadingMore={loadingMore}
            setLoadingMore={setLoadingMore}
            activeUsers={activeUsers}
            inactiveUsersWithMessages={inactiveUsersWithMessages}
            otherUsers={otherUsers}
            unreadMap={unreadMap}
            handleSelectedUser={handleSelectedUser}
            sendMessage={sendMessage}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            cookies={cookies}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
        />
    </Box>;
};

export default NavBar;
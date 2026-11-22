import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardView from './DashboardView';

const Dashboard = () => {
    const { isAuthenticated, user, hasPermission } = useAuth();
    const requiredDashboardPermission = process.env.REACT_APP_READ_DASHBOARD;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!hasPermission(requiredDashboardPermission)) {
        return (
            <div>
                Welcome <b>{user.user_name}</b>, please use the menu to navigate the site.
            </div>
        );
    }

    return <DashboardView />;
};

export default Dashboard;
import { useOutletContext } from 'react-router-dom';
import StudentAttendanceAnalyticsView from '../../components/attendance/StudentAttendanceAnalyticsView';

export default function StudentAttendance() {
  const { user } = useOutletContext<any>();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <StudentAttendanceAnalyticsView user={user} isModal={false} />
    </div>
  );
}

import { color, tw } from "../../../shared/utils/utils";
import { UserType } from "../types/user";
import DateFormatter from "../../../shared/components/DateFormatter";

interface UserDetailsExpandedRowProps {
  user: UserType;
  colSpan: number;
}

export default function UserDetailsExpandedRow({
  user,
  colSpan,
}: UserDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user.first_name && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              First Name
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(user.first_name)}
            </div>
          </div>
        )}

        {user.last_name && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Last Name
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(user.last_name)}
            </div>
          </div>
        )}

        {(user.email_address || user.email) && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Email
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(user.email_address || user.email)}
            </div>
          </div>
        )}

        {user.department && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Department
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(user.department)}
            </div>
          </div>
        )}

        {user.line_of_business && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Line of Business
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(user.line_of_business)}
            </div>
          </div>
        )}

        {user.manager_id && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Manager ID
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(user.manager_id)}
            </div>
          </div>
        )}

        {user.created_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Created
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(user.created_at)} useUserTimezone />
            </div>
          </div>
        )}

        {user.updated_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Last Updated
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(user.updated_at)} useUserTimezone />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

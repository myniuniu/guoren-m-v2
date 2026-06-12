import React, { useEffect, useMemo, useState } from 'react';
import {
  ROOT_ORG_DEPART,
  searchDepartAndUser,
  type OrgDepartItem,
  type OrgUserItem,
} from '../../../services/aiOrgMembers';

interface ContactPickerSheetProps {
  visible: boolean;
  title: string;
  selectedUsers: OrgUserItem[];
  confirmText: string;
  multiple?: boolean;
  disabledUserIDs?: string[];
  children?: React.ReactNode;
  floatingContent?: React.ReactNode;
  searchPlaceholder?: string;
  showBreadcrumb?: boolean;
  hideFooter?: boolean;
  centerTitle?: boolean;
  disabledActionText?: string;
  headerAction?: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
  };
  onClose: () => void;
  onSelectedUsersChange: (users: OrgUserItem[]) => void;
  onConfirm: (users: OrgUserItem[]) => void | Promise<void>;
}

interface DepartmentTrailItem {
  id: string;
  departName: string;
}

function buildDepartmentTrail(
  trail: DepartmentTrailItem[],
  nextDepart: OrgDepartItem,
): DepartmentTrailItem[] {
  return [...trail, { id: nextDepart.id, departName: nextDepart.departName }];
}

export default function ContactPickerSheet({
  visible,
  title,
  selectedUsers,
  confirmText,
  multiple = true,
  disabledUserIDs = [],
  children,
  floatingContent,
  searchPlaceholder = '搜索联系人',
  showBreadcrumb = true,
  hideFooter = false,
  centerTitle = false,
  disabledActionText = '已在群里',
  headerAction,
  onClose,
  onSelectedUsersChange,
  onConfirm,
}: ContactPickerSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [departments, setDepartments] = useState<OrgDepartItem[]>([]);
  const [users, setUsers] = useState<OrgUserItem[]>([]);
  const [departmentTrail, setDepartmentTrail] = useState<DepartmentTrailItem[]>([ROOT_ORG_DEPART]);

  const currentDepartment = departmentTrail[departmentTrail.length - 1];

  useEffect(() => {
    if (!visible) return;

    let canceled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await searchDepartAndUser(currentDepartment?.id, controller.signal);
        if (canceled) return;
        setDepartments(result.departs);
        setUsers(result.users);
      } catch (err) {
        if (canceled) return;
        setError(err instanceof Error ? err.message : '联系人加载失败');
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      canceled = true;
      controller.abort();
    };
  }, [currentDepartment, visible]);

  useEffect(() => {
    if (!visible) {
      setKeyword('');
      setDepartments([]);
      setUsers([]);
      setDepartmentTrail([ROOT_ORG_DEPART]);
      setError('');
      setLoading(false);
    }
  }, [visible]);

  const filteredDepartments = useMemo(() => {
    if (!keyword.trim()) return departments;
    const lowerKeyword = keyword.trim().toLowerCase();
    return departments.filter((depart) => {
      return depart.departName.toLowerCase().includes(lowerKeyword);
    });
  }, [departments, keyword]);

  const filteredUsers = useMemo(() => {
    if (!keyword.trim()) return users;
    const lowerKeyword = keyword.trim().toLowerCase();
    return users.filter((user) => {
      return user.realname.toLowerCase().includes(lowerKeyword) || user.id.toLowerCase().includes(lowerKeyword);
    });
  }, [keyword, users]);

  if (!visible) {
    return null;
  }

  const selectedIDSet = new Set(selectedUsers.map((user) => user.id));
  const disabledIDSet = new Set(disabledUserIDs);
  const shouldShowBreadcrumb = showBreadcrumb && departmentTrail.length > 1;

  const handleSelectUser = (user: OrgUserItem) => {
    if (disabledIDSet.has(user.id)) {
      return;
    }

    if (multiple) {
      if (selectedIDSet.has(user.id)) {
        onSelectedUsersChange(selectedUsers.filter((item) => item.id !== user.id));
        return;
      }
      onSelectedUsersChange([...selectedUsers, user]);
      return;
    }

    onSelectedUsersChange([user]);
  };

  const handleBackToTrail = (index: number) => {
    setDepartmentTrail((prev) => prev.slice(0, index + 1));
  };

  const handleEnterDepartment = (depart: OrgDepartItem) => {
    setDepartmentTrail((prev) => buildDepartmentTrail(prev, depart));
  };

  return (
    <div className="im-sheet-overlay im-sheet-overlay--app-shell im-sheet-overlay--top-layer" onClick={onClose}>
      <div
        className="im-sheet-panel im-sheet-panel--large im-sheet-panel--app-shell"
        onClick={(event) => event.stopPropagation()}
      >
        {centerTitle ? (
          <div className="im-sheet-header is-centered">
            <button type="button" className="im-sheet-close is-leading" aria-label={`关闭${title}`} onClick={onClose}>
              ×
            </button>
            <div className="im-sheet-title">{title}</div>
            {headerAction ? (
              <button
                type="button"
                className="im-sheet-header-action"
                disabled={headerAction.disabled}
                onClick={headerAction.onClick}
              >
                {headerAction.label}
              </button>
            ) : (
              <span className="im-sheet-header-spacer" aria-hidden="true" />
            )}
          </div>
        ) : (
          <div className="im-sheet-header">
            <div className="im-sheet-title">{title}</div>
            <button type="button" className="im-sheet-close" aria-label={`关闭${title}`} onClick={onClose}>
              ×
            </button>
          </div>
        )}

        <div className="im-sheet-body">
          <label className="im-contact-search">
            <span className="im-contact-search__icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              className="im-contact-search__input"
              placeholder={searchPlaceholder}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>

          {shouldShowBreadcrumb ? (
            <div className="im-contact-breadcrumb">
              {departmentTrail.map((depart, index) => (
                <button
                  key={`${depart.id || 'root'}-${index}`}
                  type="button"
                  className={`im-contact-breadcrumb__item${index === departmentTrail.length - 1 ? ' is-active' : ''}`}
                  onClick={() => handleBackToTrail(index)}
                >
                  {depart.departName}
                </button>
              ))}
            </div>
          ) : null}

          {children}

          <div className="im-contact-list">
            {loading ? <div className="im-sheet-status">加载中...</div> : null}
            {!loading && error ? <div className="im-sheet-status is-error">{error}</div> : null}

            {!loading && !error ? (
              <>
                {filteredDepartments.map((depart) => (
                  <button
                    key={depart.id}
                    type="button"
                    className="im-contact-list__item is-depart"
                    onClick={() => handleEnterDepartment(depart)}
                  >
                    <span>{depart.departName}</span>
                    <span className="im-contact-list__arrow">›</span>
                  </button>
                ))}

                {filteredUsers.map((user) => {
                  const checked = selectedIDSet.has(user.id);
                  const disabled = disabledIDSet.has(user.id);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      className={`im-contact-list__item${checked ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
                      aria-label={`选择${user.realname}`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="im-contact-list__main">
                        <span className="im-contact-list__name">{user.realname}</span>
                        <span className="im-contact-list__id">{user.id}</span>
                      </div>
                      <span className="im-contact-list__action">
                        {disabled ? disabledActionText : checked ? '已选中' : '选择'}
                      </span>
                    </button>
                  );
                })}

                {filteredDepartments.length === 0 && filteredUsers.length === 0 ? (
                  <div className="im-sheet-status">暂无可选联系人</div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {!hideFooter ? (
          <div className="im-sheet-footer">
            <div className="im-contact-selected-summary">
              已选 {selectedUsers.length} 人
            </div>
            <button
              type="button"
              className="im-sheet-primary"
              onClick={() => onConfirm(selectedUsers)}
              disabled={selectedUsers.length === 0}
            >
              {confirmText}
            </button>
          </div>
        ) : null}

        {floatingContent}
      </div>
    </div>
  );
}

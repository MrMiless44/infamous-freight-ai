import styles from "../styles/dashboardWidgets.module.css";

type Props = {
  message?: string | null;
};

export function StatusBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div className={styles.alertBanner} role="status">
      <span>{message}</span>
    </div>
  );
}

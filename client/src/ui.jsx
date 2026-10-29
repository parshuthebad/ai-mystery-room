export const Loading = ({ children = 'Loading…' }) => (
  <div className="py-20 text-center font-type text-xl" role="status">{children}</div>
);

export const ErrorBox = ({ children }) =>
  children ? (
    <p role="alert" className="my-4 rounded-sm border border-string bg-string/20 px-4 py-3 text-paper">{children}</p>
  ) : null;

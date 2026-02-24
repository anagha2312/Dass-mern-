const Loading = ({ size = "default", fullScreen = false }) => {
	const sizeClasses = {
		small: "h-6 w-6",
		default: "h-12 w-12",
		large: "h-16 w-16",
	};

	const spinner = (
		<div
			className={`animate-spin rounded-full border-t-2 border-b-2 border-primary-500 ${sizeClasses[size]}`}></div>
	);

	if (fullScreen) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-900'>
				{spinner}
			</div>
		);
	}

	return <div className='flex items-center justify-center p-4'>{spinner}</div>;
};

export default Loading;

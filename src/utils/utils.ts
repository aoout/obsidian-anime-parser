export function generatePaddedSequence(maxValue: number): string[] {
	const maxLength = maxValue.toString().length;

	return Array.from({ length: maxValue }, (_, i) => (i + 1).toString().padStart(maxLength, "0"));
}

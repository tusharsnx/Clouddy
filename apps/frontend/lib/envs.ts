import z from "zod";


export const EnvSchema = z.object({
    NEXT_PUBLIC_BE: z.string().nonempty(),
});

let envs: z.infer<typeof EnvSchema>;
try {
    envs = EnvSchema.parse(process.env);
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error(error.flatten().fieldErrors);
        throw error;
    }

    throw error;
}

export default envs;
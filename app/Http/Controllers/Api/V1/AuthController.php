<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ApiLoginRequest;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(ApiLoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        /** @var User|null $user */
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (! $user->isOwner() && ! $user->branch_id) {
            throw ValidationException::withMessages([
                'email' => ['Akun kasir belum ditempatkan ke cabang. Hubungi owner.'],
            ]);
        }

        $token = $user->createToken(
            $data['device_name'] ?? 'mobile',
            ['mobile']
        )->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'branch' => $this->branchPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'branch' => $this->branchPayload($user),
        ]);
    }

    /** @return array{id:int,code:string,name:string}|null */
    private function branchPayload(User $user): ?array
    {
        if ($user->branch_id === null) {
            return null;
        }

        $branch = Branch::find($user->branch_id, ['id', 'code', 'name']);

        if ($branch === null) {
            return null;
        }

        return ['id' => $branch->id, 'code' => $branch->code, 'name' => $branch->name];
    }
}

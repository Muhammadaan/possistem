<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ResolvesBranch;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ResolvesBranch;

    public function index(Request $request): JsonResponse
    {
        $branch = $this->resolveBranch($request);
        $q = $request->query('q');
        $perPage = min((int) $request->query('per_page', 20), 100);

        $products = Product::forBranch($branch->id)
            ->active()
            ->when($q, fn ($query) => $query->where(fn ($w) => $w
                ->where('sku', 'like', "%{$q}%")
                ->orWhere('name', 'like', "%{$q}%")))
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($products);
    }
}
